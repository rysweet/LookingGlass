export interface HtmlExportViewport {
  width: number;
  height: number;
}

export interface HtmlExportOptions {
  title?: string;
  previewMode?: boolean;
  tweedleSource?: string;
  viewport?: Partial<HtmlExportViewport>;
}

export interface HtmlExportDocument {
  title: string;
  previewMode: boolean;
  tweedleSource: string;
  html: string;
}

export const DEFAULT_STANDALONE_VIEWPORT: HtmlExportViewport = { width: 1280, height: 720 };
export const DEFAULT_PREVIEW_VIEWPORT: HtmlExportViewport = { width: 960, height: 540 };
