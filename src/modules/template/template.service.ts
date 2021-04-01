import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import * as path from 'path';
import { readDirDeepSync } from 'read-dir-deep';

type SUPPORTED_LANGUAGES = 'ru';
type TemplateResolver = (data: any) => string;
type TranslateMap = Map<string, TemplateResolver>;

const DEFAULT_LANG: SUPPORTED_LANGUAGES = 'ru';
const TEMPLATE_PATH = 'templates';

function diff(value: number, target: number) {
  const result = value && Math.abs(1 - target / value);
  return result !== null ? format(result * 100, 2) : '----';
}

function percent(value: number) {
  return typeof value === 'number' ? value * 100 : value;
}

function format(value: number, decimals: number | handlebars.HelperOptions) {
  if (value == null) {
    return 'unknown';
  }
  const maximumFractionDigits = typeof decimals === 'number' ? decimals : 3;
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits }).format(value);
}

function formatSign(value: number, decimals: number | handlebars.HelperOptions) {
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';

  return `${sign}${format(Math.abs(value), decimals)}`;
}

function eq(a, b, opts: handlebars.HelperOptions) {
  if (a == b)
    // Or === depending on your needs
    // eslint-disable-next-line no-invalid-this
    return opts.fn(this);
  // eslint-disable-next-line no-invalid-this
  else return opts.inverse(this);
}

@Injectable()
export class TemplateService {
  private templatesMap: TranslateMap;

  constructor() {
    this.helpers();
    this.load();
  }

  public apply(key: string, data: Object, lang: SUPPORTED_LANGUAGES = DEFAULT_LANG): string {
    // this.logger.debug(
    // 	`apply template: ${key}`,
    // );

    let template = this.getTemplate(key, lang);

    if (!template) {
      template = this.getTemplate(key, DEFAULT_LANG);
    }

    if (!template) {
      throw new Error('template-not-found');
    }

    return template(data);
  }

  private getTemplate(key: string, lang: SUPPORTED_LANGUAGES): TemplateResolver {
    const templateKey = this.getTemplateKey(lang, key);
    return this.templatesMap.get(templateKey);
  }

  private helpers() {
    handlebars.registerHelper('diff', diff);
    handlebars.registerHelper('percent', percent);
    handlebars.registerHelper('format', format);
    handlebars.registerHelper('formatSign', formatSign);
    handlebars.registerHelper('eq', eq);
  }

  private load() {
    const templatesDir: string = path.join(process.cwd(), TEMPLATE_PATH);
    const templateFileNames: string[] = readDirDeepSync(templatesDir, {
      patterns: ['**/*.md'],
    });

    this.templatesMap = templateFileNames.reduce((acc, fileName) => {
      const template = fs.readFileSync(fileName, { encoding: 'utf-8' });

      const key = path
        .relative(templatesDir, fileName)
        .replace(/\\/g, '/')
        .replace(/\.md$/, '')
        .toLowerCase();

      handlebars.registerPartial(key, template);

      return acc.set(key, handlebars.compile(template, { noEscape: true }));
    }, new Map());
  }

  private getTemplateKey(lang: SUPPORTED_LANGUAGES, key: string): string {
    return `${lang}/${key}`.toLowerCase();
  }
}
