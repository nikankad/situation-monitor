
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * Environment variables [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env`. Like [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), this module cannot be imported into client-side code. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * _Unlike_ [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), the values exported from this module are statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * ```ts
 * import { API_KEY } from '$env/static/private';
 * ```
 * 
 * Note that all environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * 
 * ```
 * MY_FEATURE_FLAG=""
 * ```
 * 
 * You can override `.env` values from the command line like so:
 * 
 * ```sh
 * MY_FEATURE_FLAG="enabled" npm run dev
 * ```
 */
declare module '$env/static/private' {
	export const VITE_FINNHUB_API_KEY: string;
	export const NoDefaultCurrentDirectoryInExePath: string;
	export const CLAUDE_CODE_ENTRYPOINT: string;
	export const VSCODE_CRASH_REPORTER_PROCESS_TYPE: string;
	export const NODE: string;
	export const INIT_CWD: string;
	export const SHELL: string;
	export const TMPDIR: string;
	export const HOMEBREW_REPOSITORY: string;
	export const npm_config_global_prefix: string;
	export const CONDA_SHLVL: string;
	export const CONDA_PROMPT_MODIFIER: string;
	export const CLAUDE_AGENT_SDK_VERSION: string;
	export const MallocNanoZone: string;
	export const COLOR: string;
	export const npm_config_noproxy: string;
	export const npm_config_local_prefix: string;
	export const ZSH: string;
	export const GIT_EDITOR: string;
	export const USER: string;
	export const LS_COLORS: string;
	export const COMMAND_MODE: string;
	export const npm_config_globalconfig: string;
	export const CONDA_EXE: string;
	export const SSH_AUTH_SOCK: string;
	export const __CF_USER_TEXT_ENCODING: string;
	export const npm_execpath: string;
	export const PAGER: string;
	export const ELECTRON_RUN_AS_NODE: string;
	export const LSCOLORS: string;
	export const PATH: string;
	export const GSETTINGS_SCHEMA_DIR: string;
	export const npm_package_json: string;
	export const _: string;
	export const npm_config_userconfig: string;
	export const npm_config_init_module: string;
	export const __CFBundleIdentifier: string;
	export const CONDA_PREFIX: string;
	export const npm_command: string;
	export const PWD: string;
	export const VSCODE_HANDLES_UNCAUGHT_ERRORS: string;
	export const npm_lifecycle_event: string;
	export const EDITOR: string;
	export const OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE: string;
	export const VSCODE_ESM_ENTRYPOINT: string;
	export const npm_package_name: string;
	export const LANG: string;
	export const npm_config_npm_version: string;
	export const XPC_FLAGS: string;
	export const npm_config_node_gyp: string;
	export const npm_package_version: string;
	export const XPC_SERVICE_NAME: string;
	export const CLAUDE_CODE_ENABLE_SDK_FILE_CHECKPOINTING: string;
	export const SHLVL: string;
	export const HOME: string;
	export const VSCODE_NLS_CONFIG: string;
	export const APPLICATION_INSIGHTS_NO_STATSBEAT: string;
	export const HOMEBREW_PREFIX: string;
	export const npm_config_cache: string;
	export const LOGNAME: string;
	export const LESS: string;
	export const CONDA_PYTHON_EXE: string;
	export const npm_lifecycle_script: string;
	export const VSCODE_IPC_HOOK: string;
	export const VSCODE_CODE_CACHE_PATH: string;
	export const COREPACK_ENABLE_AUTO_PIN: string;
	export const CONDA_DEFAULT_ENV: string;
	export const npm_config_user_agent: string;
	export const VSCODE_PID: string;
	export const INFOPATH: string;
	export const HOMEBREW_CELLAR: string;
	export const OSLogRateLimit: string;
	export const VSCODE_DOTNET_INSTALL_TOOL_ORIGINAL_HOME: string;
	export const CLAUDECODE: string;
	export const VSCODE_L10N_BUNDLE_LOCATION: string;
	export const VSCODE_CWD: string;
	export const npm_node_execpath: string;
	export const npm_config_prefix: string;
	export const NODE_ENV: string;
}

/**
 * Similar to [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private), except that it only includes environment variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Values are replaced statically at build time.
 * 
 * ```ts
 * import { PUBLIC_BASE_URL } from '$env/static/public';
 * ```
 */
declare module '$env/static/public' {
	
}

/**
 * This module provides access to runtime environment variables, as defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * This module cannot be imported into client-side code.
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * console.log(env.DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` always includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 */
declare module '$env/dynamic/private' {
	export const env: {
		VITE_FINNHUB_API_KEY: string;
		NoDefaultCurrentDirectoryInExePath: string;
		CLAUDE_CODE_ENTRYPOINT: string;
		VSCODE_CRASH_REPORTER_PROCESS_TYPE: string;
		NODE: string;
		INIT_CWD: string;
		SHELL: string;
		TMPDIR: string;
		HOMEBREW_REPOSITORY: string;
		npm_config_global_prefix: string;
		CONDA_SHLVL: string;
		CONDA_PROMPT_MODIFIER: string;
		CLAUDE_AGENT_SDK_VERSION: string;
		MallocNanoZone: string;
		COLOR: string;
		npm_config_noproxy: string;
		npm_config_local_prefix: string;
		ZSH: string;
		GIT_EDITOR: string;
		USER: string;
		LS_COLORS: string;
		COMMAND_MODE: string;
		npm_config_globalconfig: string;
		CONDA_EXE: string;
		SSH_AUTH_SOCK: string;
		__CF_USER_TEXT_ENCODING: string;
		npm_execpath: string;
		PAGER: string;
		ELECTRON_RUN_AS_NODE: string;
		LSCOLORS: string;
		PATH: string;
		GSETTINGS_SCHEMA_DIR: string;
		npm_package_json: string;
		_: string;
		npm_config_userconfig: string;
		npm_config_init_module: string;
		__CFBundleIdentifier: string;
		CONDA_PREFIX: string;
		npm_command: string;
		PWD: string;
		VSCODE_HANDLES_UNCAUGHT_ERRORS: string;
		npm_lifecycle_event: string;
		EDITOR: string;
		OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE: string;
		VSCODE_ESM_ENTRYPOINT: string;
		npm_package_name: string;
		LANG: string;
		npm_config_npm_version: string;
		XPC_FLAGS: string;
		npm_config_node_gyp: string;
		npm_package_version: string;
		XPC_SERVICE_NAME: string;
		CLAUDE_CODE_ENABLE_SDK_FILE_CHECKPOINTING: string;
		SHLVL: string;
		HOME: string;
		VSCODE_NLS_CONFIG: string;
		APPLICATION_INSIGHTS_NO_STATSBEAT: string;
		HOMEBREW_PREFIX: string;
		npm_config_cache: string;
		LOGNAME: string;
		LESS: string;
		CONDA_PYTHON_EXE: string;
		npm_lifecycle_script: string;
		VSCODE_IPC_HOOK: string;
		VSCODE_CODE_CACHE_PATH: string;
		COREPACK_ENABLE_AUTO_PIN: string;
		CONDA_DEFAULT_ENV: string;
		npm_config_user_agent: string;
		VSCODE_PID: string;
		INFOPATH: string;
		HOMEBREW_CELLAR: string;
		OSLogRateLimit: string;
		VSCODE_DOTNET_INSTALL_TOOL_ORIGINAL_HOME: string;
		CLAUDECODE: string;
		VSCODE_L10N_BUNDLE_LOCATION: string;
		VSCODE_CWD: string;
		npm_node_execpath: string;
		npm_config_prefix: string;
		NODE_ENV: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * Similar to [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), but only includes variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Note that public dynamic environment variables must all be sent from the server to the client, causing larger network requests — when possible, use `$env/static/public` instead.
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.PUBLIC_DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
