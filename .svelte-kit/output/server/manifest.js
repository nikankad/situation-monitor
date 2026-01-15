export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.ico"]),
	mimeTypes: {},
	_: {
		client: {start:"_app/immutable/entry/start.tTg-YcMX.js",app:"_app/immutable/entry/app.CKHQ-dLy.js",imports:["_app/immutable/entry/start.tTg-YcMX.js","_app/immutable/chunks/BHlL2lC2.js","_app/immutable/chunks/_Pf3XIno.js","_app/immutable/chunks/C2alNA8K.js","_app/immutable/entry/app.CKHQ-dLy.js","_app/immutable/chunks/C08FXMUQ.js","_app/immutable/chunks/_Pf3XIno.js","_app/immutable/chunks/kTt5IZRj.js","_app/immutable/chunks/C2alNA8K.js","_app/immutable/chunks/CyFrN9CW.js","_app/immutable/chunks/BqA1demz.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js'))
		],
		remotes: {
			
		},
		routes: [
			
		],
		prerendered_routes: new Set(["/"]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
