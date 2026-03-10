import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const OPENAPI_SPEC_URL = 'https://dev-api.entebus.com/executive/openapi.json';
const JAVA_CACHE_DIR = path.resolve('.cache', 'openapi-java');
const JAVA_HOME_DIR = path.join(JAVA_CACHE_DIR, 'runtime');
const DOWNLOAD_FILE = path.join(JAVA_CACHE_DIR, 'jre.tar.gz');
const EXTRACT_DIR = path.join(JAVA_CACHE_DIR, 'extract');

function log(message) {
	console.log(`[prebuild] ${message}`);
}

function fail(message) {
	console.error(`[prebuild] ${message}`);
	process.exit(1);
}

function commandExists(command, args = ['--version']) {
	const result = spawnSync(command, args, { stdio: 'ignore', shell: false });
	return result.status === 0;
}

function getJavaExecutable(javaHomeDir) {
	return path.join(javaHomeDir, 'bin', process.platform === 'win32' ? 'java.exe' : 'java');
}

function findJavaHome(rootDir) {
	const stack = [rootDir];

	while (stack.length > 0) {
		const current = stack.pop();
		if (!current) continue;

		const javaPath = getJavaExecutable(current);
		if (existsSync(javaPath)) {
			return current;
		}

		for (const entry of readdirSync(current)) {
			const fullPath = path.join(current, entry);
			if (statSync(fullPath).isDirectory()) {
				stack.push(fullPath);
			}
		}
	}

	return null;
}

async function downloadFile(url, filePath) {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to download Java runtime. HTTP ${response.status}`);
	}

	const data = Buffer.from(await response.arrayBuffer());
	writeFileSync(filePath, data);
}

function installLocalJava() {
	if (process.platform !== 'linux') {
		fail('Java is required but not found. Install Java (JDK/JRE 17+) for local builds.');
	}

	const archMap = {
		x64: 'x64',
		arm64: 'aarch64'
	};

	const mappedArch = archMap[process.arch];
	if (!mappedArch) {
		fail(`Unsupported architecture for auto Java install: ${process.arch}`);
	}

	mkdirSync(JAVA_CACHE_DIR, { recursive: true });
	rmSync(EXTRACT_DIR, { recursive: true, force: true });
	mkdirSync(EXTRACT_DIR, { recursive: true });

	const javaDownloadUrl = `https://api.adoptium.net/v3/binary/latest/21/ga/linux/${mappedArch}/jre/hotspot/normal/eclipse`;

	log(`Java not found in PATH. Downloading runtime from Adoptium (${mappedArch})...`);

	return downloadFile(javaDownloadUrl, DOWNLOAD_FILE)
		.then(() => {
			const extraction = spawnSync('tar', ['-xzf', DOWNLOAD_FILE, '-C', EXTRACT_DIR], {
				stdio: 'inherit',
				shell: false
			});

			if (extraction.status !== 0) {
				fail('Failed to extract downloaded Java runtime.');
			}

			const detectedJavaHome = findJavaHome(EXTRACT_DIR);
			if (!detectedJavaHome) {
				fail('Could not locate java executable in extracted runtime.');
			}

			rmSync(JAVA_HOME_DIR, { recursive: true, force: true });
			renameSync(detectedJavaHome, JAVA_HOME_DIR);
			rmSync(EXTRACT_DIR, { recursive: true, force: true });

			log(`Java runtime installed at ${JAVA_HOME_DIR}`);
		})
		.catch((error) => {
			fail(String(error));
		});
}

function runApiGeneration(javaBinDir) {
	const env = { ...process.env };
	if (javaBinDir) {
		env.PATH = `${javaBinDir}${path.delimiter}${env.PATH ?? ''}`;
	}

	const cliEntryPoint = path.resolve('node_modules', '@openapitools', 'openapi-generator-cli', 'main.js');
	if (!existsSync(cliEntryPoint)) {
		fail('openapi-generator-cli is not installed. Run npm install first.');
	}

	log('Generating API client from OpenAPI schema...');

	const result = spawnSync(
		process.execPath,
		[
			cliEntryPoint,
			'generate',
			'-i',
			OPENAPI_SPEC_URL,
			'-g',
			'typescript-fetch',
			'-o',
			'./src/lib/api',
			'--skip-validate-spec'
		],
		{
			stdio: 'inherit',
			env,
			shell: false
		}
	);

	if (result.error) {
		fail(`Failed to start OpenAPI generator process: ${result.error.message}`);
	}

	if (result.status !== 0) {
		fail(
			`API generation failed with exit code ${result.status ?? 1}` +
				(result.signal ? ` (signal: ${result.signal})` : '')
		);
	}
}

async function main() {
	if (commandExists('java', ['-version'])) {
		log('Using system Java from PATH.');
		runApiGeneration(null);
		return;
	}

	const localJavaExecutable = getJavaExecutable(JAVA_HOME_DIR);
	if (!existsSync(localJavaExecutable)) {
		await installLocalJava();
	}

	if (!existsSync(localJavaExecutable)) {
		fail('Java installation did not produce a valid java executable.');
	}

	log('Using cached local Java runtime.');
	runApiGeneration(path.dirname(localJavaExecutable));
}

await main();
