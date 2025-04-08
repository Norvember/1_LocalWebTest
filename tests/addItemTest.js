const { Builder, By, Key } = require('selenium-webdriver');

async function signUp(driver, username, password) {
    console.log('Attempting to sign up...');
    await driver.findElement(By.linkText('Sign Up')).click();
    await driver.sleep(2000); // wait for the page to load

    // Enter username and password for signup
    await driver.findElement(By.id('register-username')).sendKeys(username);
    await driver.findElement(By.id('register-password')).sendKeys(password, Key.RETURN);

    // Check for signup error message
    let registerErrorMessage = '';
    try {
        let errorElement = await driver.findElement(By.id('register-error'));
        registerErrorMessage = await errorElement.getText();
    } catch (e) {
        if (e.name === 'NoSuchElementError') {
            console.log('No signup error message found, assuming signup successful.');
        } else {
            throw e;
        }
    }

    if (registerErrorMessage) {
        console.log('Signup failed:', registerErrorMessage);
        throw new Error('Signup failed: ' + registerErrorMessage);
    }

    console.log('Signup successful, returning to login...');
    await driver.sleep(2000); // wait for the page to redirect back to login
}

describe('Login and Add Item Test', function () {
    it('should login, add items to the list, and return the number of added items', async function () {
        const chai = await import('chai');
        const should = chai.should();
        let username = 'testuser';
        let password = 'Testpassword123!';
        let driver = await new Builder().forBrowser('chrome').build();

        try {
            // Login logic
            await driver.get('https://norvember.github.io/SileniumWebpage/');
            while (true) {
                await driver.findElement(By.id('login-username')).sendKeys(username);
                await driver.findElement(By.id('login-password')).sendKeys(password);
                await driver.findElement(By.id('login-form')).submit();

                let errorMessage = '';
                try {
                    errorMessage = await driver.findElement(By.id('login-error')).getText();
                } catch (e) {
                    // No error message found, assume login successful
                }

                if (!errorMessage) {
                    let currentUrl = await driver.getCurrentUrl();
                    currentUrl.should.include('dashboard', 'User should be redirected to the dashboard after login');
                    console.log('Login successful!');
                    break;
                } else {
                    console.log('Login failed:', errorMessage);
                    if (errorMessage === 'Invalid username or password.') {
                        await signUp(driver, username, password);
                    } else {
                        throw new Error('Unexpected login error: ' + errorMessage);
                    }
                }
            }

            // Add items logic
            await driver.get('https://norvember.github.io/SileniumWebpage/dashboard.html');
            const itemsToAdd = ['Task 1', 'Task 2', 'Task 3'];
            for (const item of itemsToAdd) {
                await driver.findElement(By.id('item-name')).sendKeys(item, Key.RETURN);
            }

            // Verify and return the number of added items
            let itemList = await driver.findElements(By.css('#item-list li'));
            itemList.length.should.equal(itemsToAdd.length, `The item list should contain ${itemsToAdd.length} items.`);
            console.log(`Added ${itemList.length} items to the list.`);
            return itemList.length;
        } finally {
            await driver.quit();
        }
    });
});