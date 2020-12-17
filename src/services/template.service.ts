import * as path from 'path';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import { readDirDeepSync } from 'read-dir-deep';
import { Injectable, Logger } from '@nestjs/common';

type SUPPORTED_LANGUAGES = 'ru';
type TemplateResolver = (data: any) => string;
type TranslateMap = Map<string, TemplateResolver>;

const DEFAULT_LANG: SUPPORTED_LANGUAGES = 'ru';
const TEMPLATE_PATH: string = 'templates';

@Injectable()
export class TemplateService {

	private logger: Logger;
	private templatesMap: TranslateMap;

	constructor(logger: Logger) {
		this.logger = logger;

		this.load();
	}

	public apply(key: string, data: any, lang: SUPPORTED_LANGUAGES = DEFAULT_LANG): string {
		this.logger.debug(
			`apply template: ${key}`,
		);

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
		const templateKey = this.getTemplateKey(lang, key)
		return this.templatesMap.get(templateKey);
	}

	private load() {
		const templatesDir: string = path.join(
			process.cwd(),
			TEMPLATE_PATH,
		);
		const templateFileNames: string[] = readDirDeepSync(templatesDir, {
			patterns: ['**/*.md'],
		});

		this.templatesMap = templateFileNames.reduce((acc, fileName) => {
			const template = fs.readFileSync(fileName, { encoding: 'utf-8' });

			const key = path.relative(templatesDir, fileName)
				.replace(/\\/g, '/')
				.replace(/\.md$/, '')
				.toLowerCase();

			return acc.set(
				key,
				handlebars.compile(template),
			);
		}, new Map());
	}

	private getTemplateKey(
		lang: SUPPORTED_LANGUAGES,
		key: string
	): string {
		return `${lang}/${key}`.toLowerCase();
	}
}
