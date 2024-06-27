// /post/_components/PostFormFields.tsx
'use client';
import React from 'react';
import { categories } from '@/data/youtube';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import * as Label from '@radix-ui/react-label';
import * as Switch from '@radix-ui/react-switch';

interface PostFormFieldsProps {
  form: any;
  selectedPlatforms: { [key: string]: boolean };
  handleSwitchChange: (platform: string, checked: boolean) => void;
}

const PostFormFields: React.FC<PostFormFieldsProps> = ({ form, selectedPlatforms, handleSwitchChange }) => (
  <div className="space-y-2">
    <FormField
      control={form.control}
      name="title"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Title</FormLabel>
          <FormControl>
            <Input
              {...field}
              placeholder="Enter title"
              className="bg-background/50 dark:bg-background/30 ring-foreground/5"
            />
          </FormControl>
          <FormMessage className="text-red-500" />
        </FormItem>
      )}
    />
    <FormField
      control={form.control}
      name="description"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Description</FormLabel>
          <FormControl>
            <Input
              {...field}
              placeholder="Enter description"
              className="bg-background/50 dark:bg-background/30 ring-foreground/5"
            />
          </FormControl>
          <FormMessage className="text-red-500" />
        </FormItem>
      )}
    />
    <FormField
      control={form.control}
      name="dateToPost"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Date to Post</FormLabel>
          <FormControl>
            <Input
              {...field}
              type="datetime-local"
              value={field.value?.format('YYYY-MM-DDTHH:mm') || ''}
              className="bg-background/50 dark:bg-background/30 ring-foreground/5"
            />
          </FormControl>
          <FormMessage className="text-red-500" />
        </FormItem>
      )}
    />
    <div className="flex gap-5 justify-center">
      {['youtube', 'twitter', 'instagram', 'facebook'].map((platform) => (
        <div key={platform} className="flex items-center">
          <Label.Root className="text-gray-700 mr-2">
            {platform.charAt(0).toUpperCase() + platform.slice(1)}
          </Label.Root>
          <Switch.Root
            className={"SwitchRoot"}
            checked={selectedPlatforms[platform]}
            onCheckedChange={(checked) => handleSwitchChange(platform, checked)}>
            <Switch.Thumb className="SwitchThumb" />
          </Switch.Root>
        </div>
      ))}
    </div>
    {selectedPlatforms.youtube && (
      <div>
        <h5>YouTube Settings</h5>
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <select {...field} className="w-full p-2 border rounded">
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage className="text-red-500" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g., tag1,tag2"
                  className="w-full p-2 border rounded"
                />
              </FormControl>
              <FormMessage className="text-red-500" />
            </FormItem>
          )}
        />
      </div>
    )}
  </div>
);

export default PostFormFields;
