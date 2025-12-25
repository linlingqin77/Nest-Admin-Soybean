import type { GlobalThemeOverrides } from 'naive-ui';
import { defu } from 'defu';
import { addColorAlpha, getColorPalette, getPaletteColorByNumber, getRgb } from '@sa/color';
import { DARK_CLASS } from '@/constants/app';
import { toggleHtmlClass } from '@/utils/common';
import { localStg } from '@/utils/storage';
import { overrideThemeSettings, themeSettings } from '@/theme/settings';
import { themeVars } from '@/theme/vars';

/** Init theme settings */
export function initThemeSettings() {
  const isProd = import.meta.env.PROD;

  // if it is development mode, the theme settings will not be cached, by update `themeSettings` in `src/theme/settings.ts` to update theme settings
  if (!isProd) return themeSettings;

  // if it is production mode, the theme settings will be cached in localStorage
  // if want to update theme settings when publish new version, please update `overrideThemeSettings` in `src/theme/settings.ts`

  const localSettings = localStg.get('themeSettings');

  let settings = defu(localSettings, themeSettings);

  const isOverride = localStg.get('overrideThemeFlag') === BUILD_TIME;

  if (!isOverride) {
    settings = defu(overrideThemeSettings, settings);

    localStg.set('overrideThemeFlag', BUILD_TIME);
  }

  return settings;
}

/**
 * create theme token css vars value by theme settings
 *
 * @param colors Theme colors
 * @param tokens Theme setting tokens
 * @param [recommended=false] Use recommended color. Default is `false`
 */
export function createThemeToken(
  colors: App.Theme.ThemeColor,
  tokens?: App.Theme.ThemeSetting['tokens'],
  recommended = false,
) {
  const paletteColors = createThemePaletteColors(colors, recommended);

  const { light, dark } = tokens || themeSettings.tokens;

  const themeTokens: App.Theme.ThemeTokenCSSVars = {
    colors: {
      ...paletteColors,
      nprogress: paletteColors.primary,
      ...light.colors,
    },
    boxShadow: {
      ...light.boxShadow,
    },
  };

  const darkThemeTokens: App.Theme.ThemeTokenCSSVars = {
    colors: {
      ...themeTokens.colors,
      ...dark?.colors,
    },
    boxShadow: {
      ...themeTokens.boxShadow,
      ...dark?.boxShadow,
    },
  };

  return {
    themeTokens,
    darkThemeTokens,
  };
}

/**
 * Create theme palette colors
 *
 * @param colors Theme colors
 * @param [recommended=false] Use recommended color. Default is `false`
 */
function createThemePaletteColors(colors: App.Theme.ThemeColor, recommended = false) {
  const colorKeys = Object.keys(colors) as App.Theme.ThemeColorKey[];
  const colorPaletteVar = {} as App.Theme.ThemePaletteColor;

  colorKeys.forEach((key) => {
    const colorMap = getColorPalette(colors[key], recommended);

    colorPaletteVar[key] = colorMap.get(500)!;

    colorMap.forEach((hex, number) => {
      colorPaletteVar[`${key}-${number}`] = hex;
    });
  });

  return colorPaletteVar;
}

/**
 * Get css var by tokens
 *
 * @param tokens Theme base tokens
 */
function getCssVarByTokens(tokens: App.Theme.BaseToken) {
  const styles: string[] = [];

  function removeVarPrefix(value: string) {
    return value.replace('var(', '').replace(')', '');
  }

  function removeRgbPrefix(value: string) {
    return value.replace('rgb(', '').replace(')', '');
  }

  for (const [key, tokenValues] of Object.entries(themeVars)) {
    for (const [tokenKey, tokenValue] of Object.entries(tokenValues)) {
      let cssVarsKey = removeVarPrefix(tokenValue);
      let cssValue = tokens[key][tokenKey];

      if (key === 'colors') {
        cssVarsKey = removeRgbPrefix(cssVarsKey);
        const { r, g, b } = getRgb(cssValue);
        cssValue = `${r} ${g} ${b}`;
      }

      styles.push(`${cssVarsKey}: ${cssValue}`);
    }
  }

  const styleStr = styles.join(';');

  return styleStr;
}

/**
 * Add theme vars to global
 *
 * @param tokens
 */
export function addThemeVarsToGlobal(tokens: App.Theme.BaseToken, darkTokens: App.Theme.BaseToken) {
  const cssVarStr = getCssVarByTokens(tokens);
  const darkCssVarStr = getCssVarByTokens(darkTokens);

  const css = `
    :root {
      ${cssVarStr}
    }
  `;

  const darkCss = `
    html.${DARK_CLASS} {
      ${darkCssVarStr}
    }
  `;

  const styleId = 'theme-vars';

  const style = document.querySelector(`#${styleId}`) || document.createElement('style');

  style.id = styleId;

  style.textContent = css + darkCss;

  document.head.appendChild(style);
}

/**
 * Toggle css dark mode
 *
 * @param darkMode Is dark mode
 */
export function toggleCssDarkMode(darkMode = false) {
  const { add, remove } = toggleHtmlClass(DARK_CLASS);

  if (darkMode) {
    add();
  } else {
    remove();
  }
}

/**
 * Toggle auxiliary color modes
 *
 * @param grayscaleMode
 * @param colourWeakness
 */
export function toggleAuxiliaryColorModes(grayscaleMode = false, colourWeakness = false) {
  const htmlElement = document.documentElement;
  htmlElement.style.filter = [grayscaleMode ? 'grayscale(100%)' : '', colourWeakness ? 'invert(80%)' : '']
    .filter(Boolean)
    .join(' ');
}

type NaiveColorScene = '' | 'Suppl' | 'Hover' | 'Pressed' | 'Active';
type NaiveColorKey = `${App.Theme.ThemeColorKey}Color${NaiveColorScene}`;
type NaiveThemeColor = Partial<Record<NaiveColorKey, string>>;
interface NaiveColorAction {
  scene: NaiveColorScene;
  handler: (color: string) => string;
}

/**
 * Get naive theme colors
 *
 * @param colors Theme colors
 * @param [recommended=false] Use recommended color. Default is `false`
 */
function getNaiveThemeColors(colors: App.Theme.ThemeColor, recommended = false) {
  const colorActions: NaiveColorAction[] = [
    { scene: '', handler: (color) => color },
    { scene: 'Suppl', handler: (color) => color },
    { scene: 'Hover', handler: (color) => getPaletteColorByNumber(color, 500, recommended) },
    { scene: 'Pressed', handler: (color) => getPaletteColorByNumber(color, 700, recommended) },
    { scene: 'Active', handler: (color) => addColorAlpha(color, 0.1) },
  ];

  const themeColors: NaiveThemeColor = {};

  const colorEntries = Object.entries(colors) as [App.Theme.ThemeColorKey, string][];

  colorEntries.forEach((color) => {
    colorActions.forEach((action) => {
      const [colorType, colorValue] = color;
      const colorKey: NaiveColorKey = `${colorType}Color${action.scene}`;
      themeColors[colorKey] = action.handler(colorValue);
    });
  });

  return themeColors;
}

/**
 * Get component size overrides for Naive UI
 *
 * @param size Component size
 */
function getComponentSizeOverrides(size: UnionKey.ThemeComponentSize): GlobalThemeOverrides {
  const sizeMap = {
    tiny: {
      Button: {
        heightTiny: '18px',
        heightSmall: '22px',
        heightMedium: '26px',
        heightLarge: '30px',
        fontSizeTiny: '11px',
        fontSizeSmall: '12px',
        fontSizeMedium: '13px',
        fontSizeLarge: '14px',
        paddingTiny: '0 6px',
        paddingSmall: '0 8px',
        paddingMedium: '0 10px',
        paddingLarge: '0 12px',
      },
      Input: {
        heightTiny: '18px',
        heightSmall: '22px',
        heightMedium: '26px',
        heightLarge: '30px',
        fontSizeTiny: '11px',
        fontSizeSmall: '12px',
        fontSizeMedium: '13px',
        fontSizeLarge: '14px',
        paddingTiny: '0 6px',
        paddingSmall: '0 8px',
        paddingMedium: '0 10px',
        paddingLarge: '0 12px',
      },
      InputNumber: {
        heightTiny: '18px',
        heightSmall: '22px',
        heightMedium: '26px',
        heightLarge: '30px',
        fontSizeTiny: '11px',
        fontSizeSmall: '12px',
        fontSizeMedium: '13px',
        fontSizeLarge: '14px',
      },
      Select: {
        heightTiny: '18px',
        heightSmall: '22px',
        heightMedium: '26px',
        heightLarge: '30px',
        fontSizeTiny: '11px',
        fontSizeSmall: '12px',
        fontSizeMedium: '13px',
        fontSizeLarge: '14px',
      },
      DatePicker: {
        heightTiny: '18px',
        heightSmall: '22px',
        heightMedium: '26px',
        heightLarge: '30px',
        fontSizeTiny: '11px',
        fontSizeSmall: '12px',
        fontSizeMedium: '13px',
        fontSizeLarge: '14px',
      },
      TimePicker: {
        heightTiny: '18px',
        heightSmall: '22px',
        heightMedium: '26px',
        heightLarge: '30px',
        fontSizeTiny: '11px',
        fontSizeSmall: '12px',
        fontSizeMedium: '13px',
        fontSizeLarge: '14px',
      },
      Checkbox: {
        fontSizeTiny: '11px',
        fontSizeSmall: '12px',
        fontSizeMedium: '13px',
        fontSizeLarge: '14px',
        sizeTiny: '12px',
        sizeSmall: '14px',
        sizeMedium: '16px',
        sizeLarge: '18px',
      },
      Radio: {
        fontSizeTiny: '11px',
        fontSizeSmall: '12px',
        fontSizeMedium: '13px',
        fontSizeLarge: '14px',
        radioSizeTiny: '12px',
        radioSizeSmall: '14px',
        radioSizeMedium: '16px',
        radioSizeLarge: '18px',
      },
      Switch: {
        heightTiny: '14px',
        heightSmall: '16px',
        heightMedium: '18px',
        heightLarge: '20px',
        fontSize: '11px',
      },
      TreeSelect: {
        heightTiny: '18px',
        heightSmall: '22px',
        heightMedium: '26px',
        heightLarge: '30px',
        fontSizeTiny: '11px',
        fontSizeSmall: '12px',
        fontSizeMedium: '13px',
        fontSizeLarge: '14px',
      },
      Cascader: {
        heightTiny: '18px',
        heightSmall: '22px',
        heightMedium: '26px',
        heightLarge: '30px',
        fontSizeTiny: '11px',
        fontSizeSmall: '12px',
        fontSizeMedium: '13px',
        fontSizeLarge: '14px',
      },
      Transfer: {
        fontSize: '11px',
        itemHeightSmall: '20px',
        itemHeightMedium: '24px',
        itemHeightLarge: '28px',
      },
      AutoComplete: {
        heightTiny: '18px',
        heightSmall: '22px',
        heightMedium: '26px',
        heightLarge: '30px',
        fontSizeTiny: '11px',
        fontSizeSmall: '12px',
        fontSizeMedium: '13px',
        fontSizeLarge: '14px',
      },
      Upload: {
        fontSize: '11px',
      },
      Tag: {
        heightTiny: '16px',
        heightSmall: '18px',
        heightMedium: '20px',
        heightLarge: '22px',
        fontSizeTiny: '10px',
        fontSizeSmall: '11px',
        fontSizeMedium: '12px',
        fontSizeLarge: '13px',
        paddingTiny: '0 4px',
        paddingSmall: '0 6px',
        paddingMedium: '0 7px',
        paddingLarge: '0 8px',
      },
      Card: {
        fontSize: '11px',
        titleFontSizeSmall: '13px',
        titleFontSizeMedium: '14px',
        titleFontSizeLarge: '15px',
        paddingSmall: '10px 12px',
        paddingMedium: '12px 14px',
        paddingLarge: '14px 16px',
      },
      Modal: {
        fontSize: '11px',
        titleFontSize: '14px',
        paddingSmall: '10px 12px',
        paddingMedium: '12px 14px',
        paddingLarge: '14px 16px',
      },
      Drawer: {
        fontSize: '11px',
        titleFontSize: '14px',
        headerPadding: '10px 12px',
        bodyPadding: '10px 12px',
        footerPadding: '8px 10px',
      },
      Tabs: {
        tabFontSizeSmall: '11px',
        tabFontSizeMedium: '12px',
        tabFontSizeLarge: '13px',
        tabPaddingSmall: '4px 8px',
        tabPaddingMedium: '5px 10px',
        tabPaddingLarge: '6px 12px',
      },
      Pagination: {
        itemSizeSmall: '18px',
        itemSizeMedium: '22px',
        itemSizeLarge: '26px',
        itemFontSizeSmall: '10px',
        itemFontSizeMedium: '11px',
        itemFontSizeLarge: '12px',
        inputWidthSmall: '30px',
        inputWidthMedium: '36px',
        inputWidthLarge: '42px',
        selectWidthSmall: '60px',
        selectWidthMedium: '72px',
        selectWidthLarge: '84px',
      },
      Breadcrumb: {
        fontSize: '11px',
        itemLineHeight: '1.3',
      },
      Steps: {
        stepHeaderFontSizeSmall: '11px',
        stepHeaderFontSizeMedium: '12px',
        stepHeaderFontSizeLarge: '13px',
      },
      Popover: {
        fontSize: '11px',
        padding: '6px 8px',
      },
      Tooltip: {
        fontSize: '10px',
        padding: '2px 6px',
      },
      Dropdown: {
        fontSize: '11px',
        optionHeightSmall: '24px',
        optionHeightMedium: '28px',
        optionHeightLarge: '32px',
        padding: '2px',
      },
      Menu: {
        fontSize: '11px',
        itemHeight: '30px',
        itemIconSize: '14px',
      },
      Form: {
        labelFontSizeTopSmall: '11px',
        labelFontSizeTopMedium: '12px',
        labelFontSizeTopLarge: '13px',
        labelFontSizeLeftSmall: '11px',
        labelFontSizeLeftMedium: '12px',
        labelFontSizeLeftLarge: '13px',
        labelHeightSmall: '18px',
        labelHeightMedium: '22px',
        labelHeightLarge: '26px',
        feedbackFontSize: '10px',
        feedbackPadding: '1px 0 3px 0',
      },
      DataTable: {
        thSmall: '32px',
        thMedium: '36px',
        thLarge: '40px',
        tdSmall: '32px',
        tdMedium: '36px',
        tdLarge: '40px',
        fontSizeSmall: '11px',
        fontSizeMedium: '12px',
        fontSizeLarge: '13px',
        thFontSize: '12px',
        thPaddingSmall: '6px 10px',
        thPaddingMedium: '8px 12px',
        thPaddingLarge: '10px 14px',
        tdPaddingSmall: '6px 10px',
        tdPaddingMedium: '8px 12px',
        tdPaddingLarge: '10px 14px',
      },
    },
    small: {
      Button: {
        heightSmall: '24px',
        heightMedium: '28px',
        heightLarge: '32px',
        fontSizeSmall: '12px',
        fontSizeMedium: '13px',
        fontSizeLarge: '14px',
        paddingSmall: '0 10px',
        paddingMedium: '0 12px',
        paddingLarge: '0 14px',
      },
      Input: {
        heightSmall: '24px',
        heightMedium: '28px',
        heightLarge: '32px',
        fontSizeSmall: '12px',
        fontSizeMedium: '13px',
        fontSizeLarge: '14px',
        paddingSmall: '0 8px',
        paddingMedium: '0 10px',
        paddingLarge: '0 12px',
      },
      InputNumber: {
        heightSmall: '24px',
        heightMedium: '28px',
        heightLarge: '32px',
        fontSizeSmall: '12px',
        fontSizeMedium: '13px',
        fontSizeLarge: '14px',
      },
      Select: {
        heightSmall: '24px',
        heightMedium: '28px',
        heightLarge: '32px',
        fontSizeSmall: '12px',
        fontSizeMedium: '13px',
        fontSizeLarge: '14px',
      },
      DatePicker: {
        heightSmall: '24px',
        heightMedium: '28px',
        heightLarge: '32px',
        fontSizeSmall: '12px',
        fontSizeMedium: '13px',
        fontSizeLarge: '14px',
      },
      TimePicker: {
        heightSmall: '24px',
        heightMedium: '28px',
        heightLarge: '32px',
        fontSizeSmall: '12px',
        fontSizeMedium: '13px',
        fontSizeLarge: '14px',
      },
      Checkbox: {
        fontSizeSmall: '12px',
        fontSizeMedium: '13px',
        fontSizeLarge: '14px',
        sizeSmall: '14px',
        sizeMedium: '16px',
        sizeLarge: '18px',
      },
      Radio: {
        fontSizeSmall: '12px',
        fontSizeMedium: '13px',
        fontSizeLarge: '14px',
        radioSizeSmall: '14px',
        radioSizeMedium: '16px',
        radioSizeLarge: '18px',
      },
      Switch: {
        heightSmall: '18px',
        heightMedium: '20px',
        heightLarge: '22px',
        fontSize: '12px',
      },
      TreeSelect: {
        heightSmall: '24px',
        heightMedium: '28px',
        heightLarge: '32px',
        fontSizeSmall: '12px',
        fontSizeMedium: '13px',
        fontSizeLarge: '14px',
      },
      Cascader: {
        heightSmall: '24px',
        heightMedium: '28px',
        heightLarge: '32px',
        fontSizeSmall: '12px',
        fontSizeMedium: '13px',
        fontSizeLarge: '14px',
      },
      Transfer: {
        fontSize: '12px',
        itemHeightSmall: '24px',
        itemHeightMedium: '28px',
        itemHeightLarge: '32px',
      },
      AutoComplete: {
        heightSmall: '24px',
        heightMedium: '28px',
        heightLarge: '32px',
        fontSizeSmall: '12px',
        fontSizeMedium: '13px',
        fontSizeLarge: '14px',
      },
      Upload: {
        fontSize: '12px',
      },
      Tag: {
        heightSmall: '18px',
        heightMedium: '22px',
        heightLarge: '26px',
        fontSizeSmall: '11px',
        fontSizeMedium: '12px',
        fontSizeLarge: '13px',
        paddingSmall: '0 6px',
        paddingMedium: '0 8px',
        paddingLarge: '0 10px',
      },
      Card: {
        fontSize: '12px',
        titleFontSizeSmall: '14px',
        titleFontSizeMedium: '15px',
        titleFontSizeLarge: '16px',
        paddingSmall: '14px 16px',
        paddingMedium: '16px 20px',
        paddingLarge: '18px 24px',
      },
      Modal: {
        fontSize: '12px',
        titleFontSize: '15px',
        paddingSmall: '14px 16px',
        paddingMedium: '16px 20px',
        paddingLarge: '18px 24px',
      },
      Drawer: {
        fontSize: '12px',
        titleFontSize: '15px',
        headerPadding: '14px 16px',
        bodyPadding: '14px 16px',
        footerPadding: '10px 14px',
      },
      Tabs: {
        tabFontSizeSmall: '12px',
        tabFontSizeMedium: '13px',
        tabFontSizeLarge: '14px',
        tabPaddingSmall: '6px 12px',
        tabPaddingMedium: '8px 14px',
        tabPaddingLarge: '10px 16px',
      },
      Pagination: {
        itemSizeSmall: '22px',
        itemSizeMedium: '26px',
        itemSizeLarge: '30px',
        itemFontSizeSmall: '11px',
        itemFontSizeMedium: '12px',
        itemFontSizeLarge: '13px',
        inputWidthSmall: '36px',
        inputWidthMedium: '42px',
        inputWidthLarge: '48px',
        selectWidthSmall: '72px',
        selectWidthMedium: '84px',
        selectWidthLarge: '96px',
      },
      Breadcrumb: {
        fontSize: '12px',
        itemLineHeight: '1.4',
      },
      Steps: {
        stepHeaderFontSizeSmall: '12px',
        stepHeaderFontSizeMedium: '13px',
        stepHeaderFontSizeLarge: '14px',
      },
      Popover: {
        fontSize: '12px',
        padding: '10px 12px',
      },
      Tooltip: {
        fontSize: '11px',
        padding: '4px 8px',
      },
      Dropdown: {
        fontSize: '12px',
        optionHeightSmall: '28px',
        optionHeightMedium: '32px',
        optionHeightLarge: '36px',
        padding: '4px',
      },
      Menu: {
        fontSize: '12px',
        itemHeight: '36px',
        itemIconSize: '16px',
      },
      Form: {
        labelFontSizeTopSmall: '12px',
        labelFontSizeTopMedium: '13px',
        labelFontSizeTopLarge: '14px',
        labelFontSizeLeftSmall: '12px',
        labelFontSizeLeftMedium: '13px',
        labelFontSizeLeftLarge: '14px',
        labelHeightSmall: '24px',
        labelHeightMedium: '28px',
        labelHeightLarge: '32px',
        feedbackFontSize: '11px',
        feedbackPadding: '2px 0 6px 0',
      },
      DataTable: {
        thSmall: '36px',
        thMedium: '40px',
        thLarge: '44px',
        tdSmall: '36px',
        tdMedium: '40px',
        tdLarge: '44px',
        fontSizeSmall: '12px',
        fontSizeMedium: '13px',
        fontSizeLarge: '14px',
        thFontSize: '13px',
        thPaddingSmall: '8px 12px',
        thPaddingMedium: '10px 14px',
        thPaddingLarge: '12px 16px',
        tdPaddingSmall: '8px 12px',
        tdPaddingMedium: '10px 14px',
        tdPaddingLarge: '12px 16px',
      },
    },
    medium: {
      Button: {
        heightSmall: '28px',
        heightMedium: '34px',
        heightLarge: '40px',
        fontSizeSmall: '13px',
        fontSizeMedium: '14px',
        fontSizeLarge: '15px',
        paddingSmall: '0 12px',
        paddingMedium: '0 16px',
        paddingLarge: '0 18px',
      },
      Input: {
        heightSmall: '28px',
        heightMedium: '34px',
        heightLarge: '40px',
        fontSizeSmall: '13px',
        fontSizeMedium: '14px',
        fontSizeLarge: '15px',
        paddingSmall: '0 10px',
        paddingMedium: '0 12px',
        paddingLarge: '0 14px',
      },
      InputNumber: {
        heightSmall: '28px',
        heightMedium: '34px',
        heightLarge: '40px',
        fontSizeSmall: '13px',
        fontSizeMedium: '14px',
        fontSizeLarge: '15px',
      },
      Select: {
        heightSmall: '28px',
        heightMedium: '34px',
        heightLarge: '40px',
        fontSizeSmall: '13px',
        fontSizeMedium: '14px',
        fontSizeLarge: '15px',
      },
      DatePicker: {
        heightSmall: '28px',
        heightMedium: '34px',
        heightLarge: '40px',
        fontSizeSmall: '13px',
        fontSizeMedium: '14px',
        fontSizeLarge: '15px',
      },
      TimePicker: {
        heightSmall: '28px',
        heightMedium: '34px',
        heightLarge: '40px',
        fontSizeSmall: '13px',
        fontSizeMedium: '14px',
        fontSizeLarge: '15px',
      },
      Checkbox: {
        fontSizeSmall: '13px',
        fontSizeMedium: '14px',
        fontSizeLarge: '15px',
        sizeSmall: '16px',
        sizeMedium: '18px',
        sizeLarge: '20px',
      },
      Radio: {
        fontSizeSmall: '13px',
        fontSizeMedium: '14px',
        fontSizeLarge: '15px',
        radioSizeSmall: '16px',
        radioSizeMedium: '18px',
        radioSizeLarge: '20px',
      },
      Switch: {
        heightSmall: '20px',
        heightMedium: '22px',
        heightLarge: '24px',
        fontSize: '13px',
      },
      TreeSelect: {
        heightSmall: '28px',
        heightMedium: '34px',
        heightLarge: '40px',
        fontSizeSmall: '13px',
        fontSizeMedium: '14px',
        fontSizeLarge: '15px',
      },
      Cascader: {
        heightSmall: '28px',
        heightMedium: '34px',
        heightLarge: '40px',
        fontSizeSmall: '13px',
        fontSizeMedium: '14px',
        fontSizeLarge: '15px',
      },
      Transfer: {
        fontSize: '13px',
        itemHeightSmall: '28px',
        itemHeightMedium: '32px',
        itemHeightLarge: '36px',
      },
      AutoComplete: {
        heightSmall: '28px',
        heightMedium: '34px',
        heightLarge: '40px',
        fontSizeSmall: '13px',
        fontSizeMedium: '14px',
        fontSizeLarge: '15px',
      },
      Upload: {
        fontSize: '13px',
      },
      Tag: {
        heightSmall: '20px',
        heightMedium: '24px',
        heightLarge: '28px',
        fontSizeSmall: '12px',
        fontSizeMedium: '13px',
        fontSizeLarge: '14px',
        paddingSmall: '0 8px',
        paddingMedium: '0 10px',
        paddingLarge: '0 12px',
      },
      Card: {
        fontSize: '13px',
        titleFontSizeSmall: '15px',
        titleFontSizeMedium: '16px',
        titleFontSizeLarge: '17px',
        paddingSmall: '16px 20px',
        paddingMedium: '20px 24px',
        paddingLarge: '24px 28px',
      },
      Modal: {
        fontSize: '13px',
        titleFontSize: '16px',
        paddingSmall: '16px 20px',
        paddingMedium: '20px 24px',
        paddingLarge: '24px 28px',
      },
      Drawer: {
        fontSize: '13px',
        titleFontSize: '16px',
        headerPadding: '16px 20px',
        bodyPadding: '16px 20px',
        footerPadding: '12px 16px',
      },
      Tabs: {
        tabFontSizeSmall: '13px',
        tabFontSizeMedium: '14px',
        tabFontSizeLarge: '15px',
        tabPaddingSmall: '8px 14px',
        tabPaddingMedium: '10px 16px',
        tabPaddingLarge: '12px 18px',
      },
      Pagination: {
        itemSizeSmall: '24px',
        itemSizeMedium: '28px',
        itemSizeLarge: '32px',
        itemFontSizeSmall: '12px',
        itemFontSizeMedium: '13px',
        itemFontSizeLarge: '14px',
        inputWidthSmall: '40px',
        inputWidthMedium: '48px',
        inputWidthLarge: '56px',
        selectWidthSmall: '80px',
        selectWidthMedium: '96px',
        selectWidthLarge: '108px',
      },
      Breadcrumb: {
        fontSize: '13px',
        itemLineHeight: '1.5',
      },
      Steps: {
        stepHeaderFontSizeSmall: '13px',
        stepHeaderFontSizeMedium: '14px',
        stepHeaderFontSizeLarge: '15px',
      },
      Popover: {
        fontSize: '13px',
        Form: {
          labelFontSizeTopSmall: '13px',
          labelFontSizeTopMedium: '14px',
          labelFontSizeTopLarge: '15px',
          labelFontSizeLeftSmall: '13px',
          labelFontSizeLeftMedium: '14px',
          labelFontSizeLeftLarge: '15px',
          labelHeightSmall: '28px',
          labelHeightMedium: '34px',
          labelHeightLarge: '40px',
          feedbackFontSize: '12px',
          feedbackPadding: '3px 0 8px 0',
        },
        DataTable: {
          thSmall: '40px',
          thMedium: '46px',
          thLarge: '52px',
          tdSmall: '40px',
          tdMedium: '46px',
          tdLarge: '52px',
          fontSizeSmall: '13px',
          fontSizeMedium: '14px',
          fontSizeLarge: '15px',
          thFontSize: '14px',
          thPaddingSmall: '10px 14px',
          thPaddingMedium: '12px 16px',
          thPaddingLarge: '14px 18px',
          tdPaddingSmall: '10px 14px',
          tdPaddingMedium: '12px 16px',
          tdPaddingLarge: '14px 18px',
        },
      },
      large: {
        Size: '13px',
        itemHeight: '40px',
        itemIconSize: '18px',
      },
      Form: {
        labelFontSizeTopSmall: '13px',
        labelFontSizeTopMedium: '14px',
        labelFontSizeTopLarge: '15px',
        labelFontSizeLeftSmall: '13px',
        labelFontSizeLeftMedium: '14px',
        labelFontSizeLeftLarge: '15px',
        labelHeightSmall: '28px',
        labelHeightMedium: '34px',
        labelHeightLarge: '40px',
        feedbackFontSize: '12px',
        feedbackPadding: '3px 0 8px 0',
      },
    },
    large: {
      Button: {
        heightTiny: '36px',
        heightSmall: '44px',
        heightMedium: '52px',
        heightLarge: '60px',
        fontSizeTiny: '15px',
        fontSizeSmall: '16px',
        fontSizeMedium: '17px',
        fontSizeLarge: '18px',
        paddingTiny: '0 16px',
        paddingSmall: '0 20px',
        paddingMedium: '0 24px',
        paddingLarge: '0 28px',
      },
      Input: {
        heightTiny: '36px',
        heightSmall: '44px',
        heightMedium: '52px',
        heightLarge: '60px',
        fontSizeTiny: '15px',
        fontSizeSmall: '16px',
        fontSizeMedium: '17px',
        fontSizeLarge: '18px',
        paddingTiny: '0 14px',
        paddingSmall: '0 16px',
        paddingMedium: '0 18px',
        paddingLarge: '0 20px',
      },
      InputNumber: {
        heightTiny: '36px',
        heightSmall: '44px',
        heightMedium: '52px',
        heightLarge: '60px',
        fontSizeTiny: '15px',
        fontSizeSmall: '16px',
        fontSizeMedium: '17px',
        fontSizeLarge: '18px',
      },
      Select: {
        heightTiny: '36px',
        heightSmall: '44px',
        heightMedium: '52px',
        heightLarge: '60px',
        fontSizeTiny: '15px',
        fontSizeSmall: '16px',
        fontSizeMedium: '17px',
        fontSizeLarge: '18px',
      },
      DatePicker: {
        heightTiny: '36px',
        heightSmall: '44px',
        heightMedium: '52px',
        heightLarge: '60px',
        fontSizeTiny: '15px',
        fontSizeSmall: '16px',
        fontSizeMedium: '17px',
        fontSizeLarge: '18px',
      },
      TimePicker: {
        heightTiny: '36px',
        heightSmall: '44px',
        heightMedium: '52px',
        heightLarge: '60px',
        fontSizeTiny: '15px',
        fontSizeSmall: '16px',
        fontSizeMedium: '17px',
        fontSizeLarge: '18px',
      },
      Checkbox: {
        fontSizeTiny: '15px',
        fontSizeSmall: '16px',
        fontSizeMedium: '17px',
        fontSizeLarge: '18px',
        sizeTiny: '20px',
        sizeSmall: '22px',
        sizeMedium: '24px',
        sizeLarge: '26px',
      },
      Radio: {
        fontSizeTiny: '15px',
        fontSizeSmall: '16px',
        fontSizeMedium: '17px',
        fontSizeLarge: '18px',
        radioSizeTiny: '20px',
        radioSizeSmall: '22px',
        radioSizeMedium: '24px',
        radioSizeLarge: '26px',
      },
      Switch: {
        heightTiny: '26px',
        heightSmall: '28px',
        heightMedium: '30px',
        heightLarge: '32px',
        fontSize: '15px',
      },
      TreeSelect: {
        heightTiny: '36px',
        heightSmall: '44px',
        heightMedium: '52px',
        heightLarge: '60px',
        fontSizeTiny: '15px',
        fontSizeSmall: '16px',
        fontSizeMedium: '17px',
        fontSizeLarge: '18px',
      },
      Cascader: {
        heightTiny: '36px',
        heightSmall: '44px',
        heightMedium: '52px',
        heightLarge: '60px',
        fontSizeTiny: '15px',
        fontSizeSmall: '16px',
        fontSizeMedium: '17px',
        fontSizeLarge: '18px',
      },
      Transfer: {
        fontSize: '15px',
        itemHeightSmall: '36px',
        itemHeightMedium: '40px',
        itemHeightLarge: '44px',
      },
      AutoComplete: {
        heightTiny: '36px',
        heightSmall: '44px',
        heightMedium: '52px',
        heightLarge: '60px',
        fontSizeTiny: '15px',
        fontSizeSmall: '16px',
        fontSizeMedium: '17px',
        fontSizeLarge: '18px',
      },
      Upload: {
        fontSize: '15px',
      },
      Tag: {
        heightTiny: '26px',
        heightSmall: '30px',
        heightMedium: '34px',
        heightLarge: '38px',
        fontSizeTiny: '14px',
        fontSizeSmall: '15px',
        fontSizeMedium: '16px',
        fontSizeLarge: '17px',
        paddingTiny: '0 12px',
        paddingSmall: '0 14px',
        paddingMedium: '0 16px',
        paddingLarge: '0 18px',
      },
      Card: {
        fontSize: '15px',
        titleFontSizeSmall: '17px',
        titleFontSizeMedium: '18px',
        titleFontSizeLarge: '19px',
        paddingSmall: '20px 26px',
        paddingMedium: '26px 32px',
        paddingLarge: '32px 40px',
      },
      Modal: {
        fontSize: '15px',
        titleFontSize: '18px',
        paddingSmall: '20px 26px',
        paddingMedium: '26px 32px',
        paddingLarge: '32px 40px',
      },
      Drawer: {
        fontSize: '15px',
        titleFontSize: '18px',
        headerPadding: '20px 26px',
        bodyPadding: '20px 26px',
        footerPadding: '16px 20px',
      },
      Tabs: {
        tabFontSizeSmall: '15px',
        tabFontSizeMedium: '16px',
        tabFontSizeLarge: '17px',
        tabPaddingSmall: '12px 18px',
        tabPaddingMedium: '14px 20px',
        tabPaddingLarge: '16px 24px',
      },
      Pagination: {
        itemSizeSmall: '30px',
        itemSizeMedium: '34px',
        itemSizeLarge: '38px',
        itemFontSizeSmall: '14px',
        itemFontSizeMedium: '15px',
        itemFontSizeLarge: '16px',
        inputWidthSmall: '50px',
        inputWidthMedium: '60px',
        inputWidthLarge: '70px',
        selectWidthSmall: '100px',
        selectWidthMedium: '120px',
        selectWidthLarge: '140px',
      },
      Breadcrumb: {
        fontSize: '15px',
        itemLineHeight: '1.7',
      },
      Steps: {
        stepHeaderFontSizeSmall: '15px',
        stepHeaderFontSizeMedium: '16px',
        stepHeaderFontSizeLarge: '17px',
      },
      Popover: {
        fontSize: '15px',
        padding: '16px 20px',
      },
      Tooltip: {
        fontSize: '14px',
        padding: '10px 14px',
      },
      Dropdown: {
        fontSize: '15px',
        optionHeightSmall: '40px',
        optionHeightMedium: '44px',
        optionHeightLarge: '48px',
        padding: '10px',
      },
      Menu: {
        fontSize: '15px',
        itemHeight: '48px',
        itemIconSize: '22px',
      },
      Form: {
        labelFontSizeTopSmall: '15px',
        labelFontSizeTopMedium: '16px',
        labelFontSizeTopLarge: '17px',
        labelFontSizeLeftSmall: '15px',
        labelFontSizeLeftMedium: '16px',
        labelFontSizeLeftLarge: '17px',
        labelHeightSmall: '36px',
        labelHeightMedium: '44px',
        labelHeightLarge: '52px',
        feedbackFontSize: '14px',
        feedbackPadding: '5px 0 12px 0',
      },
      DataTable: {
        thSmall: '48px',
        thMedium: '56px',
        thLarge: '64px',
        tdSmall: '48px',
        tdMedium: '56px',
        tdLarge: '64px',
        fontSizeSmall: '15px',
        fontSizeMedium: '16px',
        fontSizeLarge: '17px',
        thFontSize: '16px',
        thPaddingSmall: '14px 18px',
        thPaddingMedium: '16px 22px',
        thPaddingLarge: '18px 26px',
        tdPaddingSmall: '14px 18px',
        tdPaddingMedium: '16px 22px',
        tdPaddingLarge: '18px 26px',
      },
    },
  };

  return sizeMap[size] as GlobalThemeOverrides;
}

/**
 * Get naive theme
 *
 * @param colors Theme colors
 * @param settings Theme settings object
 * @param overrides Optional manual overrides from preset
 */
export function getNaiveTheme(
  colors: App.Theme.ThemeColor,
  settings: App.Theme.ThemeSetting,
  overrides?: GlobalThemeOverrides,
) {
  const { primary: colorLoading } = colors;

  const theme: GlobalThemeOverrides = {
    common: {
      ...getNaiveThemeColors(colors, settings.recommendColor),
      borderRadius: `${settings.themeRadius}px`,
    },
    LoadingBar: {
      colorLoading,
    },
    Tag: {
      borderRadius: `${settings.themeRadius}px`,
    },
  };

  // Apply component size overrides
  const componentSizeOverrides = getComponentSizeOverrides(settings.componentSize);

  // Merge in order: base theme -> component size -> manual overrides
  // Later values have higher priority
  return overrides ? defu(overrides, componentSizeOverrides, theme) : defu(componentSizeOverrides, theme);
}
