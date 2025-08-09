let isLoggedIn = false;

function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    if (username === 'admin' && password === 'admin') {
        isLoggedIn = true;
        document.getElementById('loginPage').classList.add('hidden');
        document.getElementById('mainPage').classList.remove('hidden');
        loadSellers();
        loadCustomers();
        loadProducts();
        openTab('sellerTab');
    } else {
        document.getElementById('loginError').classList.remove('hidden');
    }
}

function logout() {
    isLoggedIn = false;
    document.getElementById('mainPage').classList.add('hidden');
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('loginError').classList.add('hidden');
}