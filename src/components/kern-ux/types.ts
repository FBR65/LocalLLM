export type Category = 'form' | 'navigation' | 'layout' | 'feedback' | 'content';
export type Status = 'stable' | 'beta' | 'experimental';
export type ViewMode = 'grid' | 'list';

export interface Component {
  id: string;
  name: string;
  description: string;
  category: Category;
  status: Status;
  tags: string[];
  documentationUrl: string;
}