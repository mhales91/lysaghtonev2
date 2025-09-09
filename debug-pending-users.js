// Debug script to test pending users on localhost
// Run this in the browser console to debug pending users

console.log('=== PENDING USERS DEBUG ===');

// Check localStorage for pending users
const pendingUsers = JSON.parse(localStorage.getItem('pendingUsers') || '[]');
console.log('Pending users in localStorage:', pendingUsers);

// Check approved users
const approvedUsers = JSON.parse(localStorage.getItem('approvedUsers') || '[]');
console.log('Approved users in localStorage:', approvedUsers);

// Check current user
const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
console.log('Current user:', currentUser);

// Test creating a new pending user
function createTestPendingUser() {
    const testUser = {
        id: Date.now().toString(),
        email: 'test@example.com',
        full_name: 'Test User',
        password: 'test123',
        user_role: 'Staff',
        approval_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    const pendingUsers = JSON.parse(localStorage.getItem('pendingUsers') || '[]');
    pendingUsers.push(testUser);
    localStorage.setItem('pendingUsers', JSON.stringify(pendingUsers));
    
    console.log('Created test pending user:', testUser);
    console.log('Updated pending users:', pendingUsers);
    
    // Refresh the page to see the changes
    window.location.reload();
}

// Function to clear all test data
function clearTestData() {
    localStorage.removeItem('pendingUsers');
    localStorage.removeItem('approvedUsers');
    console.log('Cleared all test data');
}

console.log('Available functions:');
console.log('- createTestPendingUser() - Creates a test pending user');
console.log('- clearTestData() - Clears all test data');
console.log('========================');
