import { useState, useMemo } from 'react';
import { TaskWithDetails } from '@/types/tasks';

export const useTaskFilters = (tasks: TaskWithDetails[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = !searchTerm || 
        task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesProject = !selectedProject || selectedProject === 'all' || task.project_id === selectedProject;
      const matchesStatus = !selectedStatus || selectedStatus === 'all' || task.status === selectedStatus;
      const matchesPriority = !selectedPriority || selectedPriority === 'all' || task.priority === selectedPriority;

      return matchesSearch && matchesProject && matchesStatus && matchesPriority;
    });
  }, [tasks, searchTerm, selectedProject, selectedStatus, selectedPriority]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedProject('all');
    setSelectedStatus('all');
    setSelectedPriority('all');
  };

  return {
    searchTerm,
    setSearchTerm,
    selectedProject,
    setSelectedProject,
    selectedStatus,
    setSelectedStatus,
    selectedPriority,
    setSelectedPriority,
    filteredTasks,
    clearFilters,
  };
};