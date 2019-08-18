import {Inject, Injectable} from '@angular/core';
import tinycolor2 from 'tinycolor2';
import {HueValue, MaterialCssVariables, MaterialCssVariablesConfig} from './model';
import {DOCUMENT} from '@angular/common';
import {DEFAULT_MAT_CSS_CFG} from './default-cfg.const';

interface CssVariable {
  name: string;
  val: string;
}

@Injectable({
  providedIn: 'root'
})
export class MaterialCssVarsService {
  private static PREFIX_PRIMARY = '--palette-primary-';
  private static PREFIX_ACCENT = '--palette-accent-';
  private static PREFIX_WARN = '--palette-warn-';
  private static CONTRAST_PREFIX = 'contrast-';
  private static DARK_TEXT_VAR = '--dark-primary-text';
  private static LIGHT_TEXT_VAR = '--light-primary-text';

  private static ROOT = document.documentElement;

  // This should be readonly from the outside
  cfg: MaterialCssVariablesConfig;
  primary: string;
  accent: string;
  warn: string;
  isDarkTheme: boolean;
  contrastColorThresholdPrimary: HueValue = '400';
  contrastColorThresholdAccent: HueValue = '400';
  contrastColorThresholdWarn: HueValue = '400';
  isAutoContrast = false;

  constructor(
    @Inject(DOCUMENT) private document: any,
    @Inject(DEFAULT_MAT_CSS_CFG) cfg: Partial<MaterialCssVariablesConfig>,
  ) {
    this.cfg = {
      ...DEFAULT_MAT_CSS_CFG,
      ...cfg,
    };
    this.isAutoContrast = this.cfg.isAutoContrast;
  }

  setPrimaryColor(hex: string) {
    this.primary = hex;
    const varPrefix = MaterialCssVarsService.PREFIX_PRIMARY;
    const stylePrimary = this._computePaletteColors(varPrefix, this.primary);
    this._setStyle(stylePrimary);

    if (this.isAutoContrast) {
      this._recalculateContrastColor(varPrefix);
    }
  }

  setAccentColor(hex: string) {
    this.accent = hex;
    const varPrefix = MaterialCssVarsService.PREFIX_ACCENT;
    const styleAccent = this._computePaletteColors(varPrefix, this.accent);
    this._setStyle(styleAccent);

    if (this.isAutoContrast) {
      this._recalculateContrastColor(varPrefix);
    }
  }

  setWarnColor(hex: string) {
    this.warn = hex;
    const varPrefix = MaterialCssVarsService.PREFIX_WARN;
    const styleWarn = this._computePaletteColors(varPrefix, this.warn);
    this._setStyle(styleWarn);

    if (this.isAutoContrast) {
      this._recalculateContrastColor(varPrefix);
    }
  }

  setVariable(cssVarName: MaterialCssVariables, value: string) {
    this._setStyle([{
      name: cssVarName,
      val: value,
    }]);
  }

  setDarkTheme(isDark: boolean) {
    if (isDark) {
      this.document.body.classList.remove(this.cfg.lightThemeClass);
      this.document.body.classList.add(this.cfg.darkThemeClass);
    } else {
      this.document.body.classList.remove(this.cfg.darkThemeClass);
      this.document.body.classList.add(this.cfg.lightThemeClass);
    }
    this.isDarkTheme = isDark;
  }

  setAutoContrastEnabled(val: boolean) {
    this.isAutoContrast = val;
    this._recalculateContrastColor(MaterialCssVarsService.PREFIX_PRIMARY);
  }

  changeContrastColorThresholdPrimary(threshold: HueValue) {
    this.contrastColorThresholdPrimary = threshold;
    this.changeContrastColorThreshold(threshold, MaterialCssVarsService.PREFIX_PRIMARY);
  }

  changeContrastColorThresholdAccent(threshold: HueValue) {
    this.contrastColorThresholdAccent = threshold;
    this.changeContrastColorThreshold(threshold, MaterialCssVarsService.PREFIX_ACCENT);
  }

  changeContrastColorThresholdWarn(threshold: HueValue) {
    this.contrastColorThresholdWarn = threshold;
    this.changeContrastColorThreshold(threshold, MaterialCssVarsService.PREFIX_WARN);
  }

  changeContrastColorThreshold(threshold: HueValue, palettePrefix) {
    let color = MaterialCssVarsService.DARK_TEXT_VAR;
    const updates = this.cfg.sortedHues.map((hue) => {
      if (hue === threshold) {
        color = MaterialCssVarsService.LIGHT_TEXT_VAR;
      }
      return {
        val: `var(${color})`,
        name: `${palettePrefix + MaterialCssVarsService.CONTRAST_PREFIX}${hue}`,
      };
    });
    this._setStyle(updates);
  }

  private _recalculateContrastColor(palettePrefix: string) {
    const lightText = this._getCssVarValue(MaterialCssVarsService.LIGHT_TEXT_VAR);
    const darkText = this._getCssVarValue(MaterialCssVarsService.DARK_TEXT_VAR);

    const updates = this.cfg.sortedHues.map((hue) => {
      const hueVarVal = this._getCssVarValue(`${palettePrefix}${hue}`);

      const rLight = tinycolor2.readability(`rgb(${hueVarVal})`, `rgb(${lightText})`);
      const rDark = tinycolor2.readability(`rgb(${hueVarVal})`, `rgb(${darkText})`);
      const color = (rLight > rDark)
        ? MaterialCssVarsService.LIGHT_TEXT_VAR
        : MaterialCssVarsService.DARK_TEXT_VAR;

      return {
        val: `var(${color})`,
        name: `${palettePrefix + MaterialCssVarsService.CONTRAST_PREFIX}${hue}`,
      };
    });
    this._setStyle(updates);
  }

  private _computePaletteColors(prefix: string, hex: string): CssVariable[] {
    return this.cfg.colorMap.map(item => {
      const mappedColor = tinycolor2(hex)
        .lighten(item.map[0])
        .darken(item.map[1])
        .saturate(item.map[2]);

      return this._getColorObject(
        prefix,
        item.name,
        mappedColor,
      );
    });
  }

  private _getColorObject(prefix: string, name: string, value: tinycolor2.Instance): CssVariable {
    const c = tinycolor2(value).toRgb();
    return {
      name: `${prefix}${name}`,
      val: `${c.r}, ${c.g}, ${c.b}`
    };
  }

  private _setStyle(vars: CssVariable[]) {
    vars.forEach(s => {
      MaterialCssVarsService.ROOT.style.setProperty(s.name, s.val);
    });
  }

  private _getCssVarValue(v: string): string {
    return getComputedStyle(MaterialCssVarsService.ROOT).getPropertyValue(v);
  }
}
