const Plugins = []

export function Plugin() {
	return (target => {
		Plugins.push(target.constructor);
		return target;
	}) as ClassDecorator;
}
