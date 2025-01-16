document.addEventListener('DOMContentLoaded', () => {
    const registrationForm = document.querySelector('#registration-form');
    const attendanceForm = document.querySelector('#attendance-form');
    const studentList = document.querySelector('#student-list');
    const staffList = document.querySelector('#staff-list');
    const typeField = document.querySelector('#type');
    const studentFields = document.querySelector('#student-fields');
    const staffFields = document.querySelector('#staff-fields');

    // Function to switch between tabs
    function switchTab(tabId) {
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => tab.classList.remove('active')); // Hide all tabs
        const selectedTab = document.getElementById(tabId); // Show the selected tab
        if (selectedTab) selectedTab.classList.add('active');
    }

    // Add event listeners to navigation links
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = link.getAttribute('href').substring(1); // Get tab ID
            switchTab(tabId); // Switch tab
        });
    });

    // Dynamic field visibility for registration form
    typeField.addEventListener('change', () => {
        const selectedType = typeField.value;
        studentFields.style.display = selectedType === 'student' ? 'block' : 'none';
        staffFields.style.display = selectedType === 'staff' ? 'block' : 'none';
    });

    // Handle registration form submission
    registrationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(registrationForm);
        const data = Object.fromEntries(formData.entries());

        console.log('Form data:', data);
        try {
            const response = await fetch('http://localhost:3000/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = await response.json();
            if (response.ok) {
                alert(result.message || 'Registration successful!');
                registrationForm.reset();
                typeField.dispatchEvent(new Event('change'));
                fetchAdmittedList();
            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to register.');
        }
    });

    // Fetch and display admitted list
    // Fetch and display admitted list
async function fetchAdmittedList() {
    try {
        const response = await fetch('http://localhost:3000/persons');
        const persons = await response.json();

        studentList.innerHTML = '';
        staffList.innerHTML = '';

        persons.forEach(person => {
            const li = document.createElement('li');
            const details = `
                <strong>Name:</strong> ${person.name} <br>
                <strong>Phone:</strong> ${person.phone} <br>
                <strong>Email:</strong> ${person.email} <br>
                ${person.type === 'student' ? `
                    <strong>Course:</strong> ${person.course} <br>
                    <strong>Enrollment Date:</strong> ${person.enrollmentDate || 'Not Provided'} <br>
                    <strong>Expiry Date:</strong> ${person.expiryDate || 'Not Provided'}
                ` : `
                    <strong>Department:</strong> ${person.department || 'Not Provided'}
                `}
                <button class="delete-btn" data-id="${person.id}">Delete</button>
            `;
            li.innerHTML = details;
            li.style.marginBottom = '15px';

            // Append the list item to the appropriate list (student or staff)
            if (person.type === 'student') {
                studentList.appendChild(li);
            } else if (person.type === 'staff') {
                staffList.appendChild(li);
            }

            // Attach event listener to the delete button
            const deleteBtn = li.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', async () => {
                const personId = deleteBtn.getAttribute('data-id');
                await deletePerson(personId);
            });
        });
    } catch (error) {
        console.error('Error fetching admitted list:', error);
    }
}

// Handle the delete person functionality
async function deletePerson(id) {
    try {
        console.log('Delete request sent for person ID:', id);
        const response = await fetch(`http://localhost:3000/persons/${id}`, {
            method: 'DELETE',
        });

        const result = await response.json();
        if (response.ok) {
            alert(result.message || 'Person deleted successfully!');
            fetchAdmittedList();  // Refresh the list
        } else {
            alert(result.error || 'Error deleting person.');
        }
    } catch (error) {
        console.error('Error deleting person:', error);
        alert('Error deleting person. Please try again later.');
    }
}


    // Dynamic attendance name population
    async function updateAttendanceNames() {
        const type = document.getElementById('attendance-type').value;
        try {
            const response = await fetch('http://localhost:3000/persons');
            const persons = await response.json();

            const attendanceName = document.getElementById('attendance-name');
            attendanceName.innerHTML = ''; // Clear existing options

            persons
                .filter(person => person.type === type)
                .forEach(person => {
                    const option = document.createElement('option');
                    option.value = person.name;
                    option.textContent = person.name;
                    attendanceName.appendChild(option);
                });
        } catch (error) {
            console.error('Error updating attendance names:', error);
        }
    }

    document.getElementById('attendance-type').addEventListener('change', updateAttendanceNames);

    // Handle attendance form submission
    attendanceForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const date = document.getElementById('attendance-date').value;
        const type = document.getElementById('attendance-type').value;
        const name = document.getElementById('attendance-name').value;
        const status = document.getElementById('status').value;

        if (!date || !type || !name || !status) {
            alert('All fields are required!');
            return;
        }

        const data = { date, type, name, status };

        try {
            const response = await fetch('http://localhost:3000/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();
            if (response.ok) {
                alert(result.message || 'Attendance marked successfully!');
                attendanceForm.reset();
            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error('Error recording attendance:', error);
            alert('Failed to record attendance.');
        }
    });

    // Initialize admitted list on load
    fetchAdmittedList();
    // Update names in the Dashboard tab based on selected type
// Update names in the Dashboard tab based on selected type
async function updateDashboardNames() {
    const type = document.getElementById('dashboard-type').value;
    try {
        const response = await fetch('http://localhost:3000/persons');
        const persons = await response.json();

        const dashboardName = document.getElementById('dashboard-name');
        dashboardName.innerHTML = ''; // Clear existing options

        // Filter names based on type and add them to the dropdown
        persons
            .filter(person => person.type === type)
            .forEach(person => {
                const option = document.createElement('option');
                option.value = person.name;
                option.textContent = person.name;
                dashboardName.appendChild(option);
            });
    } catch (error) {
        console.error('Error updating dashboard names:', error);
    }
}

// Display details for the selected name in the Dashboard tab
async function displayDashboardDetails() {
    const type = document.getElementById('dashboard-type').value;
    const name = document.getElementById('dashboard-name').value;

    if (!type || !name) {
        document.getElementById('dashboard-details').textContent = 'Please select a type and name.';
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/persons');
        const persons = await response.json();

        // Find the selected person's details
        const person = persons.find(p => p.name === name && p.type === type);
        if (!person) {
            document.getElementById('dashboard-details').textContent = 'No details found for the selected person.';
            return;
        }

        // Display the person's details
        const details = `
            Name: ${person.name} <br>
            Phone: ${person.phone} <br>
            Email: ${person.email} <br>
            ${type === 'student' ? `Course: ${person.course}, Enrollment Date: ${person.enrollmentDate}` : `Department: ${person.department}`}
        `;
        document.getElementById('dashboard-details').innerHTML = details;

        // Fetch and display attendance summary
        const attendanceResponse = await fetch('http://localhost:3000/attendance');
        const attendanceRecords = await attendanceResponse.json();

        const attendanceSummary = attendanceRecords.filter(
            record => record.name === name && record.type === type
        );

        const presentCount = attendanceSummary.filter(record => record.status === 'present').length;
        const absentCount = attendanceSummary.filter(record => record.status === 'absent').length;

        document.getElementById('attendance-summary').innerHTML = `
            Attendance Summary: <br>
            Present: ${presentCount}, Absent: ${absentCount}
        `;
    } catch (error) {
        console.error('Error fetching dashboard details:', error);
    }
}

// Event listeners for the Dashboard tab
document.getElementById('dashboard-type').addEventListener('change', updateDashboardNames);
document.getElementById('dashboard-name').addEventListener('change', displayDashboardDetails);
});
