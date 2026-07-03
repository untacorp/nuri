export interface LibraryNode {
  name: string;
  type: string;
  path: string;
  children?: LibraryNode[];
  description?: string;
  cover_image?: string;
  auto_compile?: boolean;
  disabled_chapters?: string[];
}
