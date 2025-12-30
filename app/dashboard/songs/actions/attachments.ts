'use server'

import { revalidatePath } from 'next/cache'
import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireManagePermission,
} from './helpers'

export async function getAttachmentUrl(attachmentId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Get the attachment
  const { data: attachment } = await adminClient
    .from('song_attachments')
    .select(`
      file_path,
      song:songs (
        church_id
      )
    `)
    .eq('id', attachmentId)
    .single()

  if (!attachment) {
    return { error: 'Attachment not found' }
  }

  const songData = Array.isArray(attachment.song) ? attachment.song[0] : attachment.song
  if (songData?.church_id !== profile.church_id) {
    return { error: 'Access denied' }
  }

  // Generate signed URL (valid for 1 hour)
  const { data: signedUrl, error } = await adminClient.storage
    .from('song-attachments')
    .createSignedUrl(attachment.file_path, 3600)

  if (error) {
    console.error('Error generating signed URL:', error)
    return { error: 'Failed to generate download URL' }
  }

  return { data: signedUrl.signedUrl }
}

export async function uploadAttachment(songId: string, formData: FormData) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { user, profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'upload attachments')
  if (permError) return { error: permError }

  // Verify song belongs to this church
  const { data: song } = await adminClient
    .from('songs')
    .select('id')
    .eq('id', songId)
    .eq('church_id', profile.church_id)
    .single()

  if (!song) {
    return { error: 'Song not found' }
  }

  const file = formData.get('file') as File
  if (!file) {
    return { error: 'No file provided' }
  }

  if (file.type !== 'application/pdf') {
    return { error: 'Only PDF files are allowed' }
  }

  if (file.size > 10 * 1024 * 1024) {
    return { error: 'File size must be less than 10MB' }
  }

  // Generate unique file path
  const fileExt = 'pdf'
  const fileName = `${profile.church_id}/${songId}/${Date.now()}.${fileExt}`

  // Upload to storage
  const { error: uploadError } = await adminClient.storage
    .from('song-attachments')
    .upload(fileName, file)

  if (uploadError) {
    console.error('Error uploading file:', uploadError)
    return { error: 'Failed to upload file' }
  }

  // Create attachment record
  const { data: attachment, error: dbError } = await adminClient
    .from('song_attachments')
    .insert({
      song_id: songId,
      file_name: file.name,
      file_path: fileName,
      file_size: file.size,
      uploaded_by: user.id,
    })
    .select()
    .single()

  if (dbError) {
    // Clean up uploaded file
    await adminClient.storage.from('song-attachments').remove([fileName])
    console.error('Error creating attachment record:', dbError)
    return { error: 'Failed to save attachment' }
  }

  revalidatePath('/dashboard/songs')
  return { data: attachment }
}

export async function deleteAttachment(attachmentId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'delete attachments')
  if (permError) return { error: permError }

  // Get the attachment
  const { data: attachment } = await adminClient
    .from('song_attachments')
    .select(`
      id,
      file_path,
      song:songs (
        church_id
      )
    `)
    .eq('id', attachmentId)
    .single()

  if (!attachment) {
    return { error: 'Attachment not found' }
  }

  const songData = Array.isArray(attachment.song) ? attachment.song[0] : attachment.song
  if (songData?.church_id !== profile.church_id) {
    return { error: 'Access denied' }
  }

  // Delete from storage
  await adminClient.storage.from('song-attachments').remove([attachment.file_path])

  // Delete record
  const { error } = await adminClient
    .from('song_attachments')
    .delete()
    .eq('id', attachmentId)

  if (error) {
    console.error('Error deleting attachment:', error)
    return { error: 'Failed to delete attachment' }
  }

  revalidatePath('/dashboard/songs')
  return { success: true }
}
