import React, { useState } from 'react';
import { apiService } from '../../services/api';
import TagList from './TagList';
import TagInput from './TagInput';

interface TagManagerProps {
  imageId: number;
  initialTags: string[];
  editable?: boolean;
  onTagsUpdate?: (tags: string[]) => void;
}

const TagManager: React.FC<TagManagerProps> = ({
  imageId,
  initialTags,
  editable = false,
  onTagsUpdate
}) => {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [loading, setLoading] = useState(false);

  const handleAddTag = async (tag: string) => {
    setLoading(true);
    try {
      const data = await apiService.post<Array<{ name: string }>>(`/api/v1/images/${imageId}/tags`, {
        tag_names: [tag]
      });
      
      // Update tags with the response from server
      const newTags = data.map((t) => t.name);
      setTags(newTags);
      onTagsUpdate?.(newTags);
      // Success - no need for alert since UI updates immediately
    } catch (error: any) {
      console.error('Error adding tag:', error);
      alert(error.response?.data?.detail || 'Failed to add tag');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTag = async (tag: string) => {
    setLoading(true);
    try {
      await apiService.delete(`/api/v1/images/${imageId}/tags/${encodeURIComponent(tag)}`);
      
      // Remove tag from local state
      const newTags = tags.filter(t => t !== tag);
      setTags(newTags);
      onTagsUpdate?.(newTags);
      // Success - no need for alert since UI updates immediately
    } catch (error: any) {
      console.error('Error removing tag:', error);
      alert(error.response?.data?.detail || 'Failed to remove tag');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Display tags */}
      <TagList
        tags={tags}
        onRemove={editable ? handleRemoveTag : undefined}
        linkable={!editable}
      />

      {/* Add tag input */}
      {editable && (
        <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
          <TagInput
            onAddTag={handleAddTag}
            existingTags={tags}
            maxTags={10}
            placeholder="Add a tag (e.g., nature, sunset, landscape)"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Press Enter to add a tag. Tags can contain letters, numbers, spaces, hyphens, and underscores.
          </p>
        </div>
      )}
    </div>
  );
};

export default TagManager;