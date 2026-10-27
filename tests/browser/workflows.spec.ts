import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

const fixture=JSON.parse(await readFile('.local/browser-fixture.json','utf8')) as {password:string;users:Record<string,{username:string}>};
for(const role of ['platform_admin','principal','vice_principal','teacher','student','parent']) {
  test(`${role}: real login, role boundary and responsive dashboard`,async({page})=>{
    const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('/');await expect(page.locator('#login-page')).toBeVisible();
    await page.locator('#login-username').fill(fixture.users[role].username);await page.locator('#login-password').fill(fixture.password);
    const login=page.waitForResponse(r=>r.url().endsWith('/api/v1/auth/login'));await page.locator('#login-submit').click();const result=await(await login).json();
    if(result.challengeId){const {code}=JSON.parse(await readFile(`.local/otp/${result.challengeId}.json`,'utf8'));await page.locator('#login-otp').fill(code);await page.locator('#login-submit').click();}
    await expect(page.locator('#main-header')).toBeVisible();await expect(page.locator(`#role-switch-${role}`)).toBeVisible();
    await expect(page.locator('#role-quick-switcher button')).toHaveCount(1);
    for(const width of [1280,390,360]){
      await page.setViewportSize({width,height:800});await expect(page.locator('#main-header')).toBeVisible();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBeTruthy();
      await page.screenshot({path:`.local/screens/${role}-${width}.png`,fullPage:true});
    }
    if(role==='parent'){await expect(page.locator('#membership-selector')).toBeVisible();const options=page.locator('#membership-selector option');expect(await options.count()).toBe(2);const second=await options.nth(1).getAttribute('value');await page.locator('#membership-selector').selectOption(second!);await expect(page.locator('#main-header')).toBeVisible();}
    if(role==='principal'){
      await page.locator('#open-accounts').click();await expect(page.locator('#accounts-modal')).toBeVisible();await page.getByRole('button',{name:'بستن',exact:true}).click();
    }
    expect(errors).toEqual([]);
    await page.locator('#logout-btn').click();await expect(page.locator('#login-page')).toBeVisible();
  });
}
test('login keeps its form when the connection fails',async({page})=>{
  await page.goto('/');await page.locator('#login-username').fill(fixture.users.student.username);await page.locator('#login-password').fill(fixture.password);
  await page.route('**/api/v1/auth/login',r=>r.abort('internetdisconnected'));await page.locator('#login-submit').click();await expect(page.getByRole('alert')).toBeVisible();await expect(page.locator('#login-username')).toHaveValue(fixture.users.student.username);
});
