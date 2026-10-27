import {defineConfig} from '@playwright/test';
import {resolve} from 'node:path';
import {existsSync} from 'node:fs';
process.env.PLAYWRIGHT_BROWSERS_PATH=resolve('.local/browsers');
const channel=process.env.BROWSER_CHANNEL||(existsSync('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe')?'msedge':undefined);
export default defineConfig({testDir:'./tests/browser',workers:1,timeout:45000,use:{baseURL:'http://localhost:3000',channel,headless:true,screenshot:'only-on-failure',trace:'retain-on-failure'},reporter:[['list'],['html',{open:'never'}]]});
