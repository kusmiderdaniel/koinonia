'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuth } from '@/hooks';
import {
  getChurchMembersWithUsers,
  getChurchMembership,
  updateMemberRole,
  updateMemberCustomFields,
  getChurch,
  createPersonWithoutAccount,
  updateChurch
} from '@/lib/services/church';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Users, Plus, Search, Settings2, ChevronDown, X, MoreVertical, Pencil, Palette, ArrowUp, ArrowDown, ArrowUpDown, Filter, Pin, WrapText } from 'lucide-react';
import type { ChurchMembershipWithUser, Church, CustomField, ChurchRole } from '@/types/church';

export default function PeoplePage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const churchId = params.id as string;
  const { user, loading: authLoading } = useAuth();

  const [members, setMembers] = useState<ChurchMembershipWithUser[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<ChurchMembershipWithUser[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [church, setChurch] = useState<Church | null>(null);

  // Column visibility and settings
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [columnSettings, setColumnSettings] = useState<Record<string, { wrap?: boolean }>>({});
  const [frozenUpToColumn, setFrozenUpToColumn] = useState<string | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const tableRef = useRef<HTMLTableElement>(null);

  // Helper to check if a column should be frozen
  const isFrozen = (columnId: string) => {
    if (!frozenUpToColumn) return false;
    const allColumns = ['name', 'email', 'role', ...visibleCustomFields.map(f => f.id)];
    const frozenIndex = allColumns.indexOf(frozenUpToColumn);
    const currentIndex = allColumns.indexOf(columnId);
    return currentIndex <= frozenIndex;
  };

  // Helper to calculate left position for frozen columns
  const getLeftPosition = (columnId: string): number => {
    if (!frozenUpToColumn || !isFrozen(columnId)) return 0;

    const allColumns = ['name', 'email', 'role', ...visibleCustomFields.map(f => f.id)];
    const currentIndex = allColumns.indexOf(columnId);

    // Calculate cumulative width up to this column using measured widths
    let leftPos = 0;
    for (let i = 0; i < currentIndex; i++) {
      const colId = allColumns[i];
      leftPos += columnWidths[colId] || 0;
    }

    return leftPos;
  };

  // Measure column widths after render
  useEffect(() => {
    if (!tableRef.current || !church) return;

    const measureColumnWidths = () => {
      const thead = tableRef.current?.querySelector('thead');
      if (!thead) return;

      const headers = thead.querySelectorAll('th');
      const widths: Record<string, number> = {};
      const customFields = church?.customFields?.sort((a, b) => a.order - b.order) || [];
      const visibleCustomFieldIds = customFields.filter(f => visibleColumns.includes(f.id)).map(f => f.id);
      const allColumns = ['name', 'email', 'role', ...visibleCustomFieldIds];

      headers.forEach((header, index) => {
        if (index < allColumns.length) {
          widths[allColumns[index]] = header.offsetWidth;
        }
      });

      setColumnWidths(widths);
    };

    // Measure on mount and when columns change
    measureColumnWidths();

    // Also measure on resize
    window.addEventListener('resize', measureColumnWidths);
    return () => window.removeEventListener('resize', measureColumnWidths);
  }, [church, visibleColumns, members, frozenUpToColumn]);

  // Sorting and filtering
  const [sortConfig, setSortConfig] = useState<{ columnId: string; direction: 'asc' | 'desc' } | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});

  // Inline editing
  const [editingCell, setEditingCell] = useState<{memberId: string, fieldId: string} | null>(null);
  const [editValue, setEditValue] = useState<any>(null);
  const [newOptionInput, setNewOptionInput] = useState<Record<string, string>>({});
  const [editingOption, setEditingOption] = useState<{fieldId: string, option: string, newValue: string} | null>(null);

  // New person dialog
  const [isNewPersonDialogOpen, setIsNewPersonDialogOpen] = useState(false);
  const [newPersonForm, setNewPersonForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'member' as ChurchRole,
  });
  const [isSubmittingNewPerson, setIsSubmittingNewPerson] = useState(false);

  // New field dialog
  const [isNewFieldDialogOpen, setIsNewFieldDialogOpen] = useState(false);
  const [newFieldForm, setNewFieldForm] = useState({
    name: '',
    type: 'text' as CustomFieldType,
    required: false,
    options: [] as string[],
    optionInput: '',
  });
  const [isSubmittingNewField, setIsSubmittingNewField] = useState(false);

  // Color palette for select/multiselect options
  const colorPalette = [
    { name: 'Blue', class: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
    { name: 'Green', class: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
    { name: 'Purple', class: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
    { name: 'Yellow', class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
    { name: 'Pink', class: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300' },
    { name: 'Indigo', class: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300' },
    { name: 'Orange', class: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
    { name: 'Teal', class: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300' },
  ];

  const getOptionColor = (fieldId: string, option: string): string => {
    const field = church?.customFields?.find(f => f.id === fieldId);
    const customColor = (field as any)?.optionColors?.[option];

    if (customColor !== undefined) {
      return colorPalette[customColor]?.class || colorPalette[0].class;
    }

    // Use a simple hash to consistently assign colors to options
    const hash = option.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colorPalette[hash % colorPalette.length].class;
  };

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push(`/${locale}/auth/signin`);
      return;
    }

    setCurrentUserId(user.uid);

    let isMounted = true;

    const loadMembers = async () => {
      try {
        setLoading(true);
        setError(null);

        const membership = await getChurchMembership(churchId);

        if (!isMounted) return;

        if (membership) {
          setUserRole(membership.role);

          // Only fetch members if user is admin or leader
          if (membership.role === 'admin' || membership.role === 'leader') {
            const [membersData, churchData] = await Promise.all([
              getChurchMembersWithUsers(churchId),
              getChurch(churchId),
            ]);
            if (isMounted) {
              setMembers(membersData);
              setFilteredMembers(membersData);
              setChurch(churchData);

              // Initialize visible columns with all custom fields
              if (churchData.customFields) {
                setVisibleColumns(churchData.customFields.map(f => f.id));
              }
            }
          } else {
            setError(locale === 'pl' ? 'Brak uprawnień do przeglądania listy członków' : 'No permission to view members list');
          }
        } else {
          setError(locale === 'pl' ? 'Nie jesteś członkiem tego kościoła' : 'You are not a member of this church');
        }
      } catch (err: any) {
        console.error('Error loading members:', err);
        if (isMounted) {
          setError(err.message || 'Failed to load members');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadMembers();

    return () => {
      isMounted = false;
    };
  }, [churchId, authLoading, user, locale, router]);

  // Filter and sort members
  useEffect(() => {
    let result = [...members];

    // Apply search filter
    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase();
      result = result.filter((member) =>
        member.userName.toLowerCase().includes(lowercaseSearch) ||
        member.role.toLowerCase().includes(lowercaseSearch) ||
        member.userEmail?.toLowerCase().includes(lowercaseSearch)
      );
    }

    // Apply column filters
    Object.entries(filters).forEach(([columnId, filterValue]) => {
      if (!filterValue) return;

      if (columnId === 'name') {
        result = result.filter(m => m.userName.toLowerCase().includes(filterValue.toLowerCase()));
      } else if (columnId === 'email') {
        result = result.filter(m => m.userEmail?.toLowerCase().includes(filterValue.toLowerCase()));
      } else if (columnId === 'role') {
        result = result.filter(m => m.role === filterValue);
      } else {
        // Custom field filter
        result = result.filter(m => {
          const value = m.customFieldValues?.[columnId];
          if (!value) return false;

          const field = church?.customFields?.find(f => f.id === columnId);
          if (!field) return false;

          if (field.type === 'select') {
            return value === filterValue;
          } else if (field.type === 'multiselect') {
            return Array.isArray(value) && value.includes(filterValue);
          } else if (field.type === 'boolean') {
            return value === filterValue;
          } else {
            return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
          }
        });
      }
    });

    // Apply sorting
    if (sortConfig) {
      result.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.columnId === 'name') {
          aValue = a.userName;
          bValue = b.userName;
        } else if (sortConfig.columnId === 'email') {
          aValue = a.userEmail || '';
          bValue = b.userEmail || '';
        } else if (sortConfig.columnId === 'role') {
          aValue = a.role;
          bValue = b.role;
        } else {
          aValue = a.customFieldValues?.[sortConfig.columnId];
          bValue = b.customFieldValues?.[sortConfig.columnId];
        }

        if (aValue === null || aValue === undefined) aValue = '';
        if (bValue === null || bValue === undefined) bValue = '';

        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredMembers(result);
  }, [searchTerm, members, filters, sortConfig, church]);

  const startEditing = (memberId: string, fieldId: string, currentValue: any) => {
    setEditingCell({ memberId, fieldId });
    setEditValue(currentValue);
  };

  const saveEdit = async (member: ChurchMembershipWithUser, fieldId: string) => {
    if (!editingCell) return;

    try {
      // Convert undefined to null for Firestore compatibility
      const normalizedValue = editValue === undefined ? null : editValue;

      const updatedValues = {
        ...(member.customFieldValues || {}),
        [fieldId]: normalizedValue,
      };

      await updateMemberCustomFields(member.id, updatedValues);

      // Update local state
      const updatedMembers = members.map(m =>
        m.id === member.id ? { ...m, customFieldValues: updatedValues } : m
      );
      setMembers(updatedMembers);
      setFilteredMembers(updatedMembers);
      setEditingCell(null);
      setEditValue(null);
    } catch (error: any) {
      console.error('Error saving field:', error);
      alert(locale === 'pl' ? 'Nie udało się zapisać' : 'Failed to save');
    }
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue(null);
  };

  const toggleColumnVisibility = (fieldId: string) => {
    setVisibleColumns(prev =>
      prev.includes(fieldId)
        ? prev.filter(id => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  const handleCreateNewPerson = async () => {
    if (!newPersonForm.firstName.trim() || !newPersonForm.lastName.trim()) {
      alert(locale === 'pl' ? 'Imię i nazwisko są wymagane' : 'First name and last name are required');
      return;
    }

    setIsSubmittingNewPerson(true);
    try {
      await createPersonWithoutAccount(churchId, {
        firstName: newPersonForm.firstName.trim(),
        lastName: newPersonForm.lastName.trim(),
        email: newPersonForm.email.trim() || undefined,
        role: newPersonForm.role,
      });

      // Refresh members list
      const membersData = await getChurchMembersWithUsers(churchId);
      setMembers(membersData);
      setFilteredMembers(membersData);

      // Reset form and close dialog
      setNewPersonForm({
        firstName: '',
        lastName: '',
        email: '',
        role: 'member',
      });
      setIsNewPersonDialogOpen(false);
    } catch (error: any) {
      console.error('Error creating person:', error);
      alert(error.message || (locale === 'pl' ? 'Nie udało się dodać osoby' : 'Failed to add person'));
    } finally {
      setIsSubmittingNewPerson(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'leader':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'volunteer':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, { pl: string; en: string }> = {
      admin: { pl: 'Administrator', en: 'Admin' },
      leader: { pl: 'Lider', en: 'Leader' },
      volunteer: { pl: 'Wolontariusz', en: 'Volunteer' },
      member: { pl: 'Członek', en: 'Member' },
    };
    const label = labels[role] || labels.member;
    return locale === 'pl' ? label.pl : label.en;
  };

  const handleCreateNewField = async () => {
    if (!newFieldForm.name.trim()) {
      alert(locale === 'pl' ? 'Nazwa pola jest wymagana' : 'Field name is required');
      return;
    }

    if ((newFieldForm.type === 'select' || newFieldForm.type === 'multiselect') && newFieldForm.options.length === 0) {
      alert(locale === 'pl' ? 'Pole wyboru musi mieć przynajmniej jedną opcję' : 'Select field must have at least one option');
      return;
    }

    setIsSubmittingNewField(true);
    try {
      const newField: CustomField = {
        id: `${Date.now()}`,
        name: newFieldForm.name.trim(),
        type: newFieldForm.type,
        required: newFieldForm.required,
        order: (church?.customFields?.length || 0) + 1,
      };

      if (newFieldForm.type === 'select' || newFieldForm.type === 'multiselect') {
        newField.options = newFieldForm.options;
      }

      const updatedFields = [...(church?.customFields || []), newField];

      await updateChurch(churchId, { customFields: updatedFields });

      // Refresh church data
      const churchData = await getChurch(churchId);
      setChurch(churchData);
      setVisibleColumns([...visibleColumns, newField.id]);

      // Reset form and close dialog
      setNewFieldForm({
        name: '',
        type: 'text',
        required: false,
        options: [],
        optionInput: '',
      });
      setIsNewFieldDialogOpen(false);
    } catch (error: any) {
      console.error('Error creating field:', error);
      alert(error.message || (locale === 'pl' ? 'Nie udało się utworzyć pola' : 'Failed to create field'));
    } finally {
      setIsSubmittingNewField(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleBooleanToggle = async (member: ChurchMembershipWithUser, fieldId: string, currentValue: any) => {
    try {
      const newValue = currentValue === true ? false : true;
      const updatedValues = {
        ...(member.customFieldValues || {}),
        [fieldId]: newValue,
      };

      await updateMemberCustomFields(member.id, updatedValues);

      // Update local state
      const updatedMembers = members.map(m =>
        m.id === member.id ? { ...m, customFieldValues: updatedValues } : m
      );
      setMembers(updatedMembers);
      setFilteredMembers(updatedMembers);
    } catch (error: any) {
      console.error('Error updating boolean:', error);
      alert(locale === 'pl' ? 'Nie udało się zapisać' : 'Failed to save');
    }
  };

  const handleMultiselectToggle = async (member: ChurchMembershipWithUser, fieldId: string, option: string, currentValue: any) => {
    try {
      const currentValues = Array.isArray(currentValue) ? currentValue : [];
      const newValue = currentValues.includes(option)
        ? currentValues.filter(v => v !== option)
        : [...currentValues, option];

      const updatedValues = {
        ...(member.customFieldValues || {}),
        [fieldId]: newValue.length > 0 ? newValue : null,
      };

      await updateMemberCustomFields(member.id, updatedValues);

      // Update local state
      const updatedMembers = members.map(m =>
        m.id === member.id ? { ...m, customFieldValues: updatedValues } : m
      );
      setMembers(updatedMembers);
      setFilteredMembers(updatedMembers);
    } catch (error: any) {
      console.error('Error updating multiselect:', error);
      alert(locale === 'pl' ? 'Nie udało się zapisać' : 'Failed to save');
    }
  };

  const handleSelectChange = async (member: ChurchMembershipWithUser, fieldId: string, value: string) => {
    try {
      const updatedValues = {
        ...(member.customFieldValues || {}),
        [fieldId]: value || null,
      };

      await updateMemberCustomFields(member.id, updatedValues);

      // Update local state
      const updatedMembers = members.map(m =>
        m.id === member.id ? { ...m, customFieldValues: updatedValues } : m
      );
      setMembers(updatedMembers);
      setFilteredMembers(updatedMembers);
    } catch (error: any) {
      console.error('Error updating select:', error);
      alert(locale === 'pl' ? 'Nie udało się zapisać' : 'Failed to save');
    }
  };

  const handleAddNewOption = async (fieldId: string, newOption: string) => {
    if (!church || !newOption.trim()) return;

    try {
      const field = church.customFields?.find(f => f.id === fieldId);
      if (!field) return;

      const updatedField = {
        ...field,
        options: [...(field.options || []), newOption.trim()],
      };

      const updatedFields = church.customFields?.map(f =>
        f.id === fieldId ? updatedField : f
      ) || [];

      await updateChurch(churchId, { customFields: updatedFields });

      // Refresh church data
      const churchData = await getChurch(churchId);
      setChurch(churchData);
    } catch (error: any) {
      console.error('Error adding option:', error);
      alert(locale === 'pl' ? 'Nie udało się dodać opcji' : 'Failed to add option');
    }
  };

  const handleRenameOption = async (fieldId: string, oldOption: string, newOption: string) => {
    if (!church || !newOption.trim() || oldOption === newOption) return;

    try {
      const field = church.customFields?.find(f => f.id === fieldId);
      if (!field) return;

      const updatedField = {
        ...field,
        options: field.options?.map(opt => opt === oldOption ? newOption.trim() : opt) || [],
      };

      // Update option colors if they exist
      if ((field as any).optionColors?.[oldOption] !== undefined) {
        const optionColors = { ...(field as any).optionColors };
        optionColors[newOption.trim()] = optionColors[oldOption];
        delete optionColors[oldOption];
        (updatedField as any).optionColors = optionColors;
      }

      const updatedFields = church.customFields?.map(f =>
        f.id === fieldId ? updatedField : f
      ) || [];

      await updateChurch(churchId, { customFields: updatedFields });

      // Update all members who have this option selected
      const membersToUpdate = members.filter(m => {
        const value = m.customFieldValues?.[fieldId];
        if (field.type === 'select') {
          return value === oldOption;
        } else if (field.type === 'multiselect') {
          return Array.isArray(value) && value.includes(oldOption);
        }
        return false;
      });

      for (const member of membersToUpdate) {
        const value = member.customFieldValues?.[fieldId];
        let newValue;
        if (field.type === 'select') {
          newValue = newOption.trim();
        } else {
          newValue = Array.isArray(value) ? value.map(v => v === oldOption ? newOption.trim() : v) : value;
        }

        await updateMemberCustomFields(member.id, {
          ...member.customFieldValues,
          [fieldId]: newValue,
        });
      }

      // Refresh church and members data
      const [churchData, membersData] = await Promise.all([
        getChurch(churchId),
        getChurchMembersWithUsers(churchId),
      ]);
      setChurch(churchData);
      setMembers(membersData);
      setFilteredMembers(membersData);
      setEditingOption(null);
    } catch (error: any) {
      console.error('Error renaming option:', error);
      alert(locale === 'pl' ? 'Nie udało się zmienić nazwy opcji' : 'Failed to rename option');
    }
  };

  const handleChangeOptionColor = async (fieldId: string, option: string, colorIndex: number) => {
    if (!church) return;

    try {
      const field = church.customFields?.find(f => f.id === fieldId);
      if (!field) return;

      const updatedField = {
        ...field,
        optionColors: {
          ...(field as any).optionColors,
          [option]: colorIndex,
        },
      };

      const updatedFields = church.customFields?.map(f =>
        f.id === fieldId ? updatedField : f
      ) || [];

      await updateChurch(churchId, { customFields: updatedFields });

      // Refresh church data
      const churchData = await getChurch(churchId);
      setChurch(churchData);
    } catch (error: any) {
      console.error('Error changing color:', error);
      alert(locale === 'pl' ? 'Nie udało się zmienić koloru' : 'Failed to change color');
    }
  };

  const renderCell = (member: ChurchMembershipWithUser, field: CustomField) => {
    const isEditing = editingCell?.memberId === member.id && editingCell?.fieldId === field.id;
    const value = member.customFieldValues?.[field.id];
    const wrapEnabled = field.type === 'multiselect' ? (columnSettings[field.id]?.wrap !== false) : true;

    // Boolean fields are directly clickable without entering edit mode
    if (field.type === 'boolean' && !isEditing) {
      return (
        <div className="min-h-[28px] px-2 py-1 rounded hover:bg-muted/50 cursor-pointer text-sm">
          <Checkbox
            checked={value === true}
            onCheckedChange={() => handleBooleanToggle(member, field.id, value)}
          />
        </div>
      );
    }

    // Select fields use a Popover for Notion-like interaction
    if (field.type === 'select' && !isEditing) {
      return (
        <Popover>
          <PopoverTrigger asChild>
            <div className="min-h-[28px] px-2 py-1 rounded hover:bg-muted/50 cursor-pointer text-sm">
              {value ? (
                <Badge className={`text-xs ${getOptionColor(field.id, value)}`}>
                  {value}
                </Badge>
              ) : (
                <span className="text-sm text-muted-foreground opacity-0 group-hover:opacity-100">
                  {locale === 'pl' ? 'Wybierz...' : 'Select...'}
                </span>
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="start">
            <div className="space-y-1">
              {field.options?.map((option) => (
                <div key={option} className="group/option flex items-center">
                  {editingOption?.fieldId === field.id && editingOption?.option === option ? (
                    <Input
                      value={editingOption.newValue}
                      onChange={(e) => setEditingOption({ ...editingOption, newValue: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleRenameOption(field.id, option, editingOption.newValue);
                        } else if (e.key === 'Escape') {
                          setEditingOption(null);
                        }
                      }}
                      onBlur={() => setEditingOption(null)}
                      className="h-8 text-xs flex-1"
                      autoFocus
                    />
                  ) : (
                    <>
                      <div
                        className={`flex items-center justify-between flex-1 px-2 py-1.5 rounded hover:bg-muted cursor-pointer ${
                          value === option ? 'bg-muted' : ''
                        }`}
                        onClick={() => handleSelectChange(member, field.id, option)}
                      >
                        <Badge className={`text-xs ${getOptionColor(field.id, option)}`}>
                          {option}
                        </Badge>
                        {value === option && (
                          <X className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 opacity-0 group-hover/option:opacity-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                            {option}
                          </div>
                          <DropdownMenuCheckboxItem
                            onSelect={(e) => {
                              e.preventDefault();
                              setEditingOption({ fieldId: field.id, option, newValue: option });
                            }}
                          >
                            <Pencil className="h-3 w-3 mr-2" />
                            {locale === 'pl' ? 'Edytuj' : 'Edit'}
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem
                            onSelect={(e) => e.preventDefault()}
                          >
                            <Palette className="h-3 w-3 mr-2" />
                            {locale === 'pl' ? 'Kolor' : 'Color'}
                          </DropdownMenuCheckboxItem>
                          <div className="grid grid-cols-4 gap-1 p-2">
                            {colorPalette.map((color, index) => (
                              <button
                                key={index}
                                className={`w-6 h-6 rounded border-2 ${color.class} ${
                                  getOptionColor(field.id, option) === color.class
                                    ? 'border-foreground'
                                    : 'border-transparent'
                                }`}
                                onClick={() => handleChangeOptionColor(field.id, option, index)}
                              />
                            ))}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </div>
              ))}
              <div className="border-t pt-2 mt-2">
                <Input
                  placeholder={locale === 'pl' ? 'Utwórz nową opcję...' : 'Create new option...'}
                  value={newOptionInput[field.id] || ''}
                  onChange={(e) => setNewOptionInput({ ...newOptionInput, [field.id]: e.target.value })}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter' && newOptionInput[field.id]?.trim()) {
                      e.preventDefault();
                      const newOption = newOptionInput[field.id].trim();
                      await handleAddNewOption(field.id, newOption);
                      await handleSelectChange(member, field.id, newOption);
                      setNewOptionInput({ ...newOptionInput, [field.id]: '' });
                    }
                  }}
                  className="h-8 text-xs"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      );
    }

    // Multiselect fields use a Popover for Notion-like interaction
    if (field.type === 'multiselect' && !isEditing) {
      const selectedValues = Array.isArray(value) ? value : [];
      return (
        <Popover>
          <PopoverTrigger asChild>
            <div className="min-h-[28px] px-2 py-1 rounded hover:bg-muted/50 cursor-pointer text-sm">
              {selectedValues.length > 0 ? (
                <div className={`flex gap-1 ${wrapEnabled ? 'flex-wrap' : 'flex-nowrap overflow-hidden'}`}>
                  {selectedValues.map((v) => (
                    <Badge key={v} className={`text-xs ${getOptionColor(field.id, v)} ${!wrapEnabled ? 'shrink-0' : ''}`}>
                      {v}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground opacity-0 group-hover:opacity-100">
                  {locale === 'pl' ? 'Wybierz...' : 'Select...'}
                </span>
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="start">
            <div className="space-y-1">
              {field.options?.map((option) => (
                <div key={option} className="group/option flex items-center">
                  {editingOption?.fieldId === field.id && editingOption?.option === option ? (
                    <Input
                      value={editingOption.newValue}
                      onChange={(e) => setEditingOption({ ...editingOption, newValue: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleRenameOption(field.id, option, editingOption.newValue);
                        } else if (e.key === 'Escape') {
                          setEditingOption(null);
                        }
                      }}
                      onBlur={() => setEditingOption(null)}
                      className="h-8 text-xs flex-1"
                      autoFocus
                    />
                  ) : (
                    <>
                      <div
                        className={`flex items-center justify-between flex-1 px-2 py-1.5 rounded hover:bg-muted cursor-pointer ${
                          selectedValues.includes(option) ? 'bg-muted' : ''
                        }`}
                        onClick={() => handleMultiselectToggle(member, field.id, option, value)}
                      >
                        <Badge className={`text-xs ${getOptionColor(field.id, option)}`}>
                          {option}
                        </Badge>
                        {selectedValues.includes(option) && (
                          <X className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 opacity-0 group-hover/option:opacity-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                            {option}
                          </div>
                          <DropdownMenuCheckboxItem
                            onSelect={(e) => {
                              e.preventDefault();
                              setEditingOption({ fieldId: field.id, option, newValue: option });
                            }}
                          >
                            <Pencil className="h-3 w-3 mr-2" />
                            {locale === 'pl' ? 'Edytuj' : 'Edit'}
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem
                            onSelect={(e) => e.preventDefault()}
                          >
                            <Palette className="h-3 w-3 mr-2" />
                            {locale === 'pl' ? 'Kolor' : 'Color'}
                          </DropdownMenuCheckboxItem>
                          <div className="grid grid-cols-4 gap-1 p-2">
                            {colorPalette.map((color, index) => (
                              <button
                                key={index}
                                className={`w-6 h-6 rounded border-2 ${color.class} ${
                                  getOptionColor(field.id, option) === color.class
                                    ? 'border-foreground'
                                    : 'border-transparent'
                                }`}
                                onClick={() => handleChangeOptionColor(field.id, option, index)}
                              />
                            ))}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </div>
              ))}
              <div className="border-t pt-2 mt-2">
                <Input
                  placeholder={locale === 'pl' ? 'Utwórz nową opcję...' : 'Create new option...'}
                  value={newOptionInput[field.id] || ''}
                  onChange={(e) => setNewOptionInput({ ...newOptionInput, [field.id]: e.target.value })}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter' && newOptionInput[field.id]?.trim()) {
                      e.preventDefault();
                      const newOption = newOptionInput[field.id].trim();
                      await handleAddNewOption(field.id, newOption);
                      await handleMultiselectToggle(member, field.id, newOption, value);
                      setNewOptionInput({ ...newOptionInput, [field.id]: '' });
                    }
                  }}
                  className="h-8 text-xs"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      );
    }

    if (isEditing) {
      return (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {field.type === 'text' && (
            <Input
              value={editValue !== undefined && editValue !== null ? String(editValue) : ''}
              onChange={(e) => setEditValue(e.target.value || null)}
              onBlur={() => saveEdit(member, field.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit(member, field.id);
                if (e.key === 'Escape') cancelEdit();
              }}
              className="h-7 text-sm"
              autoFocus
            />
          )}
          {field.type === 'number' && (
            <Input
              type="number"
              value={editValue !== undefined && editValue !== null ? String(editValue) : ''}
              onChange={(e) => setEditValue(e.target.value ? parseFloat(e.target.value) : null)}
              onBlur={() => saveEdit(member, field.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit(member, field.id);
                if (e.key === 'Escape') cancelEdit();
              }}
              className="h-7 text-sm"
              autoFocus
            />
          )}
          {field.type === 'date' && (
            <Input
              type="date"
              value={editValue !== undefined && editValue !== null ? String(editValue) : ''}
              onChange={(e) => setEditValue(e.target.value || null)}
              onBlur={() => saveEdit(member, field.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit(member, field.id);
                if (e.key === 'Escape') cancelEdit();
              }}
              className="h-7 text-sm"
              autoFocus
            />
          )}
          {field.type === 'boolean' && (
            <Checkbox
              checked={editValue === true}
              onCheckedChange={(checked) => {
                setEditValue(checked === true ? true : false);
                setTimeout(() => saveEdit(member, field.id), 100);
              }}
            />
          )}
        </div>
      );
    }

    // Display mode (for non-special field types)
    return (
      <div
        className="min-h-[28px] px-2 py-1 rounded hover:bg-muted/50 cursor-pointer text-sm"
        onClick={() => startEditing(member.id, field.id, value)}
      >
        {field.type === 'date' && value && (
          <span className="text-sm text-muted-foreground">
            {formatDate(value)}
          </span>
        )}
        {(field.type === 'text' || field.type === 'number') && value && (
          <span className="text-sm">{value}</span>
        )}
        {!value && (
          <span className="text-sm text-muted-foreground opacity-0 group-hover:opacity-100">
            {locale === 'pl' ? 'Dodaj...' : 'Add...'}
          </span>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              {locale === 'pl' ? 'Ładowanie...' : 'Loading...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-md bg-destructive/10 p-4 text-destructive">
          <p className="font-medium">
            {locale === 'pl' ? 'Błąd' : 'Error'}
          </p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const isAdmin = userRole === 'admin';
  const isLeader = userRole === 'leader' || isAdmin;

  const customFields = church?.customFields?.sort((a, b) => a.order - b.order) || [];
  const visibleCustomFields = customFields.filter(f => visibleColumns.includes(f.id));

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8" />
              {locale === 'pl' ? 'Ludzie' : 'People'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {filteredMembers.length} {locale === 'pl' ? 'osób' : 'people'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Column visibility */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings2 className="h-4 w-4 mr-2" />
                  {locale === 'pl' ? 'Kolumny' : 'Columns'}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {customFields.map((field) => (
                  <DropdownMenuCheckboxItem
                    key={field.id}
                    checked={visibleColumns.includes(field.id)}
                    onCheckedChange={() => toggleColumnVisibility(field.id)}
                  >
                    {field.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {isLeader && (
              <>
                <Button variant="outline" size="sm" onClick={() => setIsNewFieldDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {locale === 'pl' ? 'Nowe pole' : 'New field'}
                </Button>
                <Button size="sm" onClick={() => setIsNewPersonDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {locale === 'pl' ? 'Nowa osoba' : 'New person'}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={locale === 'pl' ? 'Szukaj...' : 'Search...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Database Table */}
      <div className="border rounded-lg overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table ref={tableRef} className="w-auto border-collapse">
            <thead className="bg-muted/50 border-b">
              <tr>
                {/* Name Column */}
                <th className={`px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap group ${isFrozen('name') ? 'sticky bg-muted z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]' : ''}`}
                  style={isFrozen('name') ? { left: `${getLeftPosition('name')}px`, backgroundColor: 'hsl(var(--muted))' } : undefined}
                >
                  <div className="flex items-center gap-1">
                    <span>{locale === 'pl' ? 'Nazwa' : 'Name'}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100">
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuCheckboxItem
                          onSelect={() => {
                            if (sortConfig?.columnId === 'name' && sortConfig.direction === 'asc') {
                              setSortConfig({ columnId: 'name', direction: 'desc' });
                            } else {
                              setSortConfig({ columnId: 'name', direction: 'asc' });
                            }
                          }}
                        >
                          {sortConfig?.columnId === 'name' && sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 mr-2" /> : sortConfig?.columnId === 'name' && sortConfig.direction === 'desc' ? <ArrowDown className="h-3 w-3 mr-2" /> : <ArrowUpDown className="h-3 w-3 mr-2" />}
                          {locale === 'pl' ? 'Sortuj' : 'Sort'}
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          onSelect={(e) => e.preventDefault()}
                        >
                          <Filter className="h-3 w-3 mr-2" />
                          {locale === 'pl' ? 'Filtruj' : 'Filter'}
                        </DropdownMenuCheckboxItem>
                        <div className="px-2 py-1.5">
                          <Input
                            placeholder={locale === 'pl' ? 'Szukaj...' : 'Search...'}
                            value={filters['name'] || ''}
                            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                            className="h-7 text-xs"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <DropdownMenuCheckboxItem
                          checked={frozenUpToColumn === 'name'}
                          onSelect={() => setFrozenUpToColumn(frozenUpToColumn === 'name' ? null : 'name')}
                        >
                          <Pin className="h-3 w-3 mr-2" />
                          {locale === 'pl' ? 'Przypnij do tej kolumny' : 'Freeze up to here'}
                        </DropdownMenuCheckboxItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </th>

                {/* Email Column */}
                <th className={`px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap group ${isFrozen('email') ? 'sticky bg-muted z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]' : ''}`}
                  style={isFrozen('email') ? { left: `${getLeftPosition('email')}px`, backgroundColor: 'hsl(var(--muted))' } : undefined}
                >
                  <div className="flex items-center gap-1">
                    <span>{locale === 'pl' ? 'Email' : 'Email'}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100">
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuCheckboxItem
                          onSelect={() => {
                            if (sortConfig?.columnId === 'email' && sortConfig.direction === 'asc') {
                              setSortConfig({ columnId: 'email', direction: 'desc' });
                            } else {
                              setSortConfig({ columnId: 'email', direction: 'asc' });
                            }
                          }}
                        >
                          {sortConfig?.columnId === 'email' && sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 mr-2" /> : sortConfig?.columnId === 'email' && sortConfig.direction === 'desc' ? <ArrowDown className="h-3 w-3 mr-2" /> : <ArrowUpDown className="h-3 w-3 mr-2" />}
                          {locale === 'pl' ? 'Sortuj' : 'Sort'}
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          onSelect={(e) => e.preventDefault()}
                        >
                          <Filter className="h-3 w-3 mr-2" />
                          {locale === 'pl' ? 'Filtruj' : 'Filter'}
                        </DropdownMenuCheckboxItem>
                        <div className="px-2 py-1.5">
                          <Input
                            placeholder={locale === 'pl' ? 'Szukaj...' : 'Search...'}
                            value={filters['email'] || ''}
                            onChange={(e) => setFilters({ ...filters, email: e.target.value })}
                            className="h-7 text-xs"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <DropdownMenuCheckboxItem
                          checked={frozenUpToColumn === 'email'}
                          onSelect={() => setFrozenUpToColumn(frozenUpToColumn === 'email' ? null : 'email')}
                        >
                          <Pin className="h-3 w-3 mr-2" />
                          {locale === 'pl' ? 'Przypnij do tej kolumny' : 'Freeze up to here'}
                        </DropdownMenuCheckboxItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </th>

                {/* Role Column */}
                <th className={`px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap group ${isFrozen('role') ? 'sticky bg-muted z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]' : ''}`}
                  style={isFrozen('role') ? { left: `${getLeftPosition('role')}px`, backgroundColor: 'hsl(var(--muted))' } : undefined}
                >
                  <div className="flex items-center gap-1">
                    <span>{locale === 'pl' ? 'Rola' : 'Role'}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100">
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuCheckboxItem
                          onSelect={() => {
                            if (sortConfig?.columnId === 'role' && sortConfig.direction === 'asc') {
                              setSortConfig({ columnId: 'role', direction: 'desc' });
                            } else {
                              setSortConfig({ columnId: 'role', direction: 'asc' });
                            }
                          }}
                        >
                          {sortConfig?.columnId === 'role' && sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 mr-2" /> : sortConfig?.columnId === 'role' && sortConfig.direction === 'desc' ? <ArrowDown className="h-3 w-3 mr-2" /> : <ArrowUpDown className="h-3 w-3 mr-2" />}
                          {locale === 'pl' ? 'Sortuj' : 'Sort'}
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={frozenUpToColumn === 'role'}
                          onSelect={() => setFrozenUpToColumn(frozenUpToColumn === 'role' ? null : 'role')}
                        >
                          <Pin className="h-3 w-3 mr-2" />
                          {locale === 'pl' ? 'Przypnij do tej kolumny' : 'Freeze up to here'}
                        </DropdownMenuCheckboxItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </th>

                {/* Custom Fields */}
                {visibleCustomFields.map((field) => {
                  const isMultiselect = field.type === 'multiselect';
                  const wrapEnabled = columnSettings[field.id]?.wrap !== false;

                  return (
                    <th
                      key={field.id}
                      className={`px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap group ${isFrozen(field.id) ? 'sticky bg-muted z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]' : ''}`}
                      style={isFrozen(field.id) ? { left: `${getLeftPosition(field.id)}px`, backgroundColor: 'hsl(var(--muted))' } : (isMultiselect && !wrapEnabled ? { maxWidth: '200px' } : undefined)}
                    >
                      <div className="flex items-center gap-1">
                        <span>{field.name}</span>
                        {field.required && <span className="text-red-500">*</span>}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100">
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuCheckboxItem
                              onSelect={() => {
                                if (sortConfig?.columnId === field.id && sortConfig.direction === 'asc') {
                                  setSortConfig({ columnId: field.id, direction: 'desc' });
                                } else {
                                  setSortConfig({ columnId: field.id, direction: 'asc' });
                                }
                              }}
                            >
                              {sortConfig?.columnId === field.id && sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 mr-2" /> : sortConfig?.columnId === field.id && sortConfig.direction === 'desc' ? <ArrowDown className="h-3 w-3 mr-2" /> : <ArrowUpDown className="h-3 w-3 mr-2" />}
                              {locale === 'pl' ? 'Sortuj' : 'Sort'}
                            </DropdownMenuCheckboxItem>
                            {isMultiselect && (
                              <DropdownMenuCheckboxItem
                                checked={wrapEnabled}
                                onCheckedChange={(checked) => {
                                  setColumnSettings({
                                    ...columnSettings,
                                    [field.id]: { wrap: checked }
                                  });
                                }}
                              >
                                <WrapText className="h-3 w-3 mr-2" />
                                {locale === 'pl' ? 'Zawijaj wartości' : 'Wrap values'}
                              </DropdownMenuCheckboxItem>
                            )}
                            <DropdownMenuCheckboxItem
                              checked={frozenUpToColumn === field.id}
                              onSelect={() => setFrozenUpToColumn(frozenUpToColumn === field.id ? null : field.id)}
                            >
                              <Pin className="h-3 w-3 mr-2" />
                              {locale === 'pl' ? 'Przypnij do tej kolumny' : 'Freeze up to here'}
                            </DropdownMenuCheckboxItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td
                    colSpan={3 + visibleCustomFields.length}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    {searchTerm
                      ? (locale === 'pl' ? 'Nie znaleziono osób' : 'No people found')
                      : (locale === 'pl' ? 'Brak osób' : 'No people')}
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-muted/30 group"
                  >
                    <td className={`px-4 py-2 whitespace-nowrap ${isFrozen('name') ? 'sticky bg-card group-hover:bg-muted z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]' : ''}`}
                      style={isFrozen('name') ? { left: `${getLeftPosition('name')}px`, backgroundColor: 'hsl(var(--card))' } : undefined}>
                      <div className="font-medium text-sm">{member.userName}</div>
                    </td>
                    <td className={`px-4 py-2 whitespace-nowrap ${isFrozen('email') ? 'sticky bg-card group-hover:bg-muted z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]' : ''}`}
                      style={isFrozen('email') ? { left: `${getLeftPosition('email')}px`, backgroundColor: 'hsl(var(--card))' } : undefined}>
                      <div className="text-sm text-muted-foreground">{member.userEmail}</div>
                    </td>
                    <td className={`px-4 py-2 whitespace-nowrap ${isFrozen('role') ? 'sticky bg-card group-hover:bg-muted z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]' : ''}`}
                      style={isFrozen('role') ? { left: `${getLeftPosition('role')}px`, backgroundColor: 'hsl(var(--card))' } : undefined}>
                      <Badge className={`text-xs ${getRoleBadgeColor(member.role)}`}>
                        {getRoleLabel(member.role)}
                      </Badge>
                    </td>
                    {visibleCustomFields.map((field) => {
                      const isMultiselect = field.type === 'multiselect';
                      const wrapEnabled = columnSettings[field.id]?.wrap !== false;
                      const baseCellClass = isMultiselect && !wrapEnabled ? 'px-4 py-2 overflow-hidden text-ellipsis whitespace-nowrap' : 'px-4 py-2';
                      const cellClass = `${baseCellClass} ${isFrozen(field.id) ? 'sticky bg-card group-hover:bg-muted z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]' : ''}`;

                      return (
                        <td key={field.id} className={cellClass} style={isFrozen(field.id) ? { left: `${getLeftPosition(field.id)}px`, backgroundColor: 'hsl(var(--card))' } : (isMultiselect && !wrapEnabled ? { maxWidth: '200px' } : undefined)}>
                          {renderCell(member, field)}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Person Dialog */}
      <Dialog open={isNewPersonDialogOpen} onOpenChange={setIsNewPersonDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{locale === 'pl' ? 'Dodaj nową osobę' : 'Add new person'}</DialogTitle>
            <DialogDescription>
              {locale === 'pl'
                ? 'Dodaj osobę do bazy danych. Jeśli ta osoba później utworzy konto, zostanie automatycznie powiązana.'
                : 'Add a person to the database. If they create an account later, they will be automatically linked.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                {locale === 'pl' ? 'Imię' : 'First name'} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                value={newPersonForm.firstName}
                onChange={(e) => setNewPersonForm({ ...newPersonForm, firstName: e.target.value })}
                placeholder={locale === 'pl' ? 'Jan' : 'John'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">
                {locale === 'pl' ? 'Nazwisko' : 'Last name'} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lastName"
                value={newPersonForm.lastName}
                onChange={(e) => setNewPersonForm({ ...newPersonForm, lastName: e.target.value })}
                placeholder={locale === 'pl' ? 'Kowalski' : 'Doe'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{locale === 'pl' ? 'Email (opcjonalny)' : 'Email (optional)'}</Label>
              <Input
                id="email"
                type="email"
                value={newPersonForm.email}
                onChange={(e) => setNewPersonForm({ ...newPersonForm, email: e.target.value })}
                placeholder="john@example.com"
              />
              <p className="text-xs text-muted-foreground">
                {locale === 'pl'
                  ? 'Email będzie użyty do powiązania konta, jeśli osoba dołączy później.'
                  : 'Email will be used to link their account if they join later.'}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">{locale === 'pl' ? 'Rola' : 'Role'}</Label>
              <Select
                value={newPersonForm.role}
                onValueChange={(value: ChurchRole) => setNewPersonForm({ ...newPersonForm, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">{locale === 'pl' ? 'Członek' : 'Member'}</SelectItem>
                  <SelectItem value="volunteer">{locale === 'pl' ? 'Wolontariusz' : 'Volunteer'}</SelectItem>
                  <SelectItem value="leader">{locale === 'pl' ? 'Lider' : 'Leader'}</SelectItem>
                  {isAdmin && (
                    <SelectItem value="admin">{locale === 'pl' ? 'Administrator' : 'Admin'}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewPersonDialogOpen(false)} disabled={isSubmittingNewPerson}>
              {locale === 'pl' ? 'Anuluj' : 'Cancel'}
            </Button>
            <Button onClick={handleCreateNewPerson} disabled={isSubmittingNewPerson}>
              {isSubmittingNewPerson
                ? (locale === 'pl' ? 'Dodawanie...' : 'Adding...')
                : (locale === 'pl' ? 'Dodaj' : 'Add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Field Dialog */}
      <Dialog open={isNewFieldDialogOpen} onOpenChange={setIsNewFieldDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{locale === 'pl' ? 'Dodaj nowe pole' : 'Add new field'}</DialogTitle>
            <DialogDescription>
              {locale === 'pl'
                ? 'Utwórz nową kolumnę w bazie danych osób.'
                : 'Create a new column in the people database.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fieldName">
                {locale === 'pl' ? 'Nazwa pola' : 'Field name'} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fieldName"
                value={newFieldForm.name}
                onChange={(e) => setNewFieldForm({ ...newFieldForm, name: e.target.value })}
                placeholder={locale === 'pl' ? 'np. Telefon' : 'e.g. Phone'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fieldType">{locale === 'pl' ? 'Typ pola' : 'Field type'}</Label>
              <Select
                value={newFieldForm.type}
                onValueChange={(value: CustomFieldType) => setNewFieldForm({ ...newFieldForm, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">{locale === 'pl' ? 'Tekst' : 'Text'}</SelectItem>
                  <SelectItem value="number">{locale === 'pl' ? 'Liczba' : 'Number'}</SelectItem>
                  <SelectItem value="date">{locale === 'pl' ? 'Data' : 'Date'}</SelectItem>
                  <SelectItem value="select">{locale === 'pl' ? 'Pojedynczy wybór' : 'Select'}</SelectItem>
                  <SelectItem value="multiselect">{locale === 'pl' ? 'Wiele opcji' : 'Multi-select'}</SelectItem>
                  <SelectItem value="boolean">{locale === 'pl' ? 'Tak/Nie' : 'Yes/No'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(newFieldForm.type === 'select' || newFieldForm.type === 'multiselect') && (
              <div className="space-y-2">
                <Label>{locale === 'pl' ? 'Opcje' : 'Options'}</Label>
                <div className="flex gap-2">
                  <Input
                    value={newFieldForm.optionInput}
                    onChange={(e) => setNewFieldForm({ ...newFieldForm, optionInput: e.target.value })}
                    placeholder={locale === 'pl' ? 'Dodaj opcję' : 'Add option'}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newFieldForm.optionInput.trim()) {
                        e.preventDefault();
                        setNewFieldForm({
                          ...newFieldForm,
                          options: [...newFieldForm.options, newFieldForm.optionInput.trim()],
                          optionInput: '',
                        });
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (newFieldForm.optionInput.trim()) {
                        setNewFieldForm({
                          ...newFieldForm,
                          options: [...newFieldForm.options, newFieldForm.optionInput.trim()],
                          optionInput: '',
                        });
                      }
                    }}
                  >
                    {locale === 'pl' ? 'Dodaj' : 'Add'}
                  </Button>
                </div>
                {newFieldForm.options.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newFieldForm.options.map((option, index) => {
                      const hash = option.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                      const colorClass = colorPalette[hash % colorPalette.length].class;
                      return (
                        <Badge key={index} className={colorClass}>
                          {option}
                          <button
                            type="button"
                            onClick={() => {
                              setNewFieldForm({
                                ...newFieldForm,
                                options: newFieldForm.options.filter((_, i) => i !== index),
                              });
                            }}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Checkbox
                id="fieldRequired"
                checked={newFieldForm.required}
                onCheckedChange={(checked) => setNewFieldForm({ ...newFieldForm, required: checked === true })}
              />
              <Label htmlFor="fieldRequired" className="cursor-pointer">
                {locale === 'pl' ? 'Pole wymagane' : 'Required field'}
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewFieldDialogOpen(false)} disabled={isSubmittingNewField}>
              {locale === 'pl' ? 'Anuluj' : 'Cancel'}
            </Button>
            <Button onClick={handleCreateNewField} disabled={isSubmittingNewField}>
              {isSubmittingNewField
                ? (locale === 'pl' ? 'Tworzenie...' : 'Creating...')
                : (locale === 'pl' ? 'Utwórz' : 'Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
