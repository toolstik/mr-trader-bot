import { MyContext } from './../types/my-context';
import * as path from 'path';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import { readDirDeepSync } from 'read-dir-deep';
import { Injectable, Logger } from '@nestjs/common';

type SUPPORTED_LANGUAGES = 'ru';
type TemplateResolver = (ctx: MyContext, data: any) => string;
type LangTranslate = Map<string, TemplateResolver>;
type TranslateMap = Record<SUPPORTED_LANGUAGES, LangTranslate>;

function splitLimit(input: string, splitter: string, limit: number = -1): string[] {
	if (limit === 0) {
		return [input];
	}

	const index = input.indexOf(splitter);

	if (index < 0) {
		return [input];
	}

	const head = input.slice(0, index);
	const tail = input.slice(index + splitter.length);

	return [head, ...splitLimit(tail, splitter, limit - 1)];
}

@Injectable()
export class TemplateService {
	private readonly DEFAULT_LANG: SUPPORTED_LANGUAGES = 'ru';
	private readonly TEMPLATE_PATH: string = 'templates';

	private logger: Logger;
	private templatesMap: TranslateMap;

	constructor(logger: Logger) {
		this.logger = logger;

		this.load();
	}

	public apply(key: string, data: any): string {
		this.logger.debug(
			`apply template: ${key}`,
		);

		let template = this.getTemplate(params);

		if (!template) {
			params.lang = this.DEFAULT_LANG;
			template = this.getTemplate(params);
		}

		if (!template) {
			throw new Error('template-not-found');
		}

		return template(data);
	}

	private getTemplate(key: string): (data: any) => string {
		const templateKey = this.getTemplateKey()
		return this.templatesMap.get(key);
	}

	private load() {
		const templatesDir: string = path.join(
			process.cwd(),
			this.TEMPLATE_PATH,
		);
		const templateFileNames: string[] = readDirDeepSync(templatesDir, {
			patterns: ['**/*.md'],
		});

		this.templatesMap = templateFileNames.reduce((acc, fileName) => {
			const template = fs.readFileSync(fileName, { encoding: 'utf-8' });

			const relative = path.relative(templatesDir, fileName)
				.replace(/\\/, '/')
				.replace(/\.md$/, '');

			const [lang, key] = splitLimit(relative, '/', 1);

			const langObj: LangTranslate = acc[lang] || new Map();

			langObj.set(
				key,
				handlebars.compile(template),
			);

			acc[lang] = langObj;

			return acc;
		}, {} as TranslateMap);
	}

	private getTemplateKey(
		lang: string,
		key: string
	): string {
		return `${lang}/${key}`;
	}
}
