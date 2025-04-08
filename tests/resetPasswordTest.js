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

describe('Reset Password Test', function () {
    this.timeout(30000); // Increase timeout to 30 seconds for the test suite

    it('should follow the reset password flow and login successfully', async function () {
        const chai = await import('chai');
        const should = chai.should();
        let username = 'testuser';
        let password = 'Testpassword123!';
        let wrongPassword = 'WrongPassword123!';
        let driver = await new Builder().forBrowser('chrome').build();

        try {
            // Step 1: Attempt login with no username
            await driver.get('https://norvember.github.io/SileniumWebpage/');
            await driver.findElement(By.id('login-username')).sendKeys('');
            await driver.findElement(By.id('login-password')).sendKeys(password);
            await driver.findElement(By.id('login-form')).submit();

            let errorMessage = '';
            try {
                errorMessage = await driver.findElement(By.id('login-error')).getText();
            } catch (e) {
                // No error message found
            }

            if (errorMessage) {
                console.log('Login failed:', errorMessage);
                errorMessage.should.equal('Invalid username or password.', 'Expected error message for missing username');
            }

            // Step 2: Sign up
            await signUp(driver, username, password);

            // Step 3: Attempt login with wrong password
            await driver.findElement(By.id('login-username')).sendKeys(username);
            await driver.findElement(By.id('login-password')).sendKeys(wrongPassword);
            await driver.findElement(By.id('login-form')).submit();

            errorMessage = '';
            try {
                errorMessage = await driver.findElement(By.id('login-error')).getText();
            } catch (e) {
                // No error message found
            }

            if (errorMessage) {
                console.log('Login failed with wrong password:', errorMessage);
                errorMessage.should.equal('Invalid username or password.', 'Expected error message for wrong password');
            }

            // Step 4: Reset password
            await driver.findElement(By.linkText('Forgot Password?')).click();
            await driver.sleep(2000); // wait for the page to load

            await driver.findElement(By.id('recover-username')).sendKeys(username);
            await driver.findElement(By.id('recover-password-form')).submit();

            let successMessage = '';
            try {
                successMessage = await driver.findElement(By.id('recover-success')).getText();
            } catch (e) {
                // No success message found
            }

            successMessage.should.include(password, 'Expected success message with the reset password');

            // Navigate back to the login page
            await driver.findElement(By.linkText('Back to Login')).click();
            await driver.sleep(2000); // wait for the page to load

            // Step 5: Login successfully with the reset password
            await driver.findElement(By.id('login-username')).sendKeys(username);
            await driver.findElement(By.id('login-password')).sendKeys(password);
            await driver.findElement(By.id('login-form')).submit();

            let currentUrl = await driver.getCurrentUrl();
            currentUrl.should.include('dashboard', 'User should be redirected to the dashboard after successful login');
            console.log('Login successful after password reset!');
        } finally {
            await driver.quit();
        }
    });
});