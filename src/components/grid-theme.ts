import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

// AG Grid dressed in the Homeward design system (see globals.css): white, hairline borders,
// mono uppercase headers, one green accent.
export const gridTheme = themeQuartz.withParams({
  accentColor: '#008a4b',
  backgroundColor: '#ffffff',
  foregroundColor: '#0a0b0d',
  borderColor: '#e4e7ec',
  headerBackgroundColor: '#f4f5f7',
  headerTextColor: '#667085',
  headerFontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
  headerFontSize: 11,
  headerFontWeight: 400,
  fontFamily: 'var(--font-geist), system-ui, sans-serif',
  fontSize: 14,
  rowHoverColor: '#f4f5f7',
  selectedRowBackgroundColor: 'rgb(0 196 106 / 0.12)',
  oddRowBackgroundColor: '#ffffff',
  wrapperBorderRadius: 20,
  rowHeight: 52,
  headerHeight: 44,
  spacing: 8,
});

export const usd = (value: number) => `$${value.toFixed(2)}`;
