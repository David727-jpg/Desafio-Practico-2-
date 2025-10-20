// Clase para manejar las transacciones
class Transaction {
    constructor(id, type, description, amount, date) {
        this.id = id;
        this.type = type;
        this.description = description;
        this.amount = parseFloat(amount);
        this.date = date || new Date();
    }
}

// Clase principal de la aplicación
class BudgetApp {
    constructor() {
        this.transactions = JSON.parse(localStorage.getItem('budgetTransactions')) || [];
        this.currentId = this.transactions.length > 0 ? Math.max(...this.transactions.map(t => t.id)) + 1 : 1;
        
        this.init();
    }
    
    init() {
        this.setCurrentMonth();
        this.renderTransactions();
        this.calculateTotals();
        this.setupEventListeners();
        this.setupTabs();
        this.addSampleData();
    }
    
    // PUNTO 1: Establecer el mes actual en el título
    setCurrentMonth() {
        const months = [
            'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
        ];
        
        const now = new Date();
        const month = months[now.getMonth()];
        const year = now.getFullYear();
        
        document.getElementById('month-title').textContent = `Presupuesto de ${month} ${year}`;
    }
    
    // Configurar pestañas
    setupTabs() {
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remover clase active de todas las pestañas y contenidos
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                // Agregar clase active a la pestaña clickeada
                tab.classList.add('active');
                
                // Mostrar el contenido correspondiente
                const target = tab.getAttribute('data-target');
                document.getElementById(target).classList.add('active');
            });
        });
    }
    
    // Configurar event listeners
    setupEventListeners() {
        document.getElementById('transaction-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTransaction();
        });
    }
    
    // Agregar datos de ejemplo si no hay transacciones
    addSampleData() {
        if (this.transactions.length === 0) {
            const sampleTransactions = [
                new Transaction(1, 'income', 'Salario', 2500.00),
                new Transaction(2, 'income', 'Freelance', 800.00),
                new Transaction(3, 'expense', 'Alquiler', 1200.00),
                new Transaction(4, 'expense', 'Supermercado', 350.00),
                new Transaction(5, 'expense', 'Transporte', 150.00)
            ];
            
            this.transactions = sampleTransactions;
            this.currentId = 6;
            this.saveToLocalStorage();
            this.renderTransactions();
            this.calculateTotals();
            
            this.showNotification('¡Datos de ejemplo cargados! Puedes agregar tus propias transacciones.', 'success');
        }
    }
    
    // Mostrar notificación
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // Agregar una nueva transacción
    addTransaction() {
        const type = document.getElementById('transaction-type').value;
        const description = document.getElementById('transaction-description').value;
        const amount = document.getElementById('transaction-amount').value;
        
        if (!type || !description || !amount) {
            this.showNotification('Por favor, complete todos los campos', 'error');
            return;
        }
        
        const transaction = new Transaction(
            this.currentId++,
            type,
            description,
            amount
        );
        
        this.transactions.push(transaction);
        this.saveToLocalStorage();
        this.renderTransactions();
        this.calculateTotals();
        
        // Mostrar notificación de éxito
        this.showNotification(
            `${type === 'income' ? 'Ingreso' : 'Egreso'} agregado correctamente`, 
            'success'
        );
        
        // Limpiar formulario
        document.getElementById('transaction-form').reset();
        
        // Cambiar a la pestaña correspondiente
        const targetTab = type === 'income' ? 'income-list' : 'expense-list';
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        document.querySelector(`[data-target="${targetTab}"]`).classList.add('active');
        document.getElementById(targetTab).classList.add('active');
    }
    
    // Eliminar una transacción
    deleteTransaction(id) {
        if (confirm('¿Estás seguro de que quieres eliminar esta transacción?')) {
            const transaction = this.transactions.find(t => t.id === id);
            this.transactions = this.transactions.filter(t => t.id !== id);
            this.saveToLocalStorage();
            this.renderTransactions();
            this.calculateTotals();
            
            this.showNotification(
                `Transacción "${transaction.description}" eliminada`, 
                'success'
            );
        }
    }
    
    // Guardar en localStorage
    saveToLocalStorage() {
        localStorage.setItem('budgetTransactions', JSON.stringify(this.transactions));
    }
    
    // Renderizar las transacciones
    renderTransactions() {
        this.renderIncomeTransactions();
        this.renderExpenseTransactions();
    }
    
    // Renderizar transacciones de ingresos
    renderIncomeTransactions() {
        const incomeContainer = document.getElementById('income-transactions');
        const incomeTransactions = this.transactions.filter(t => t.type === 'income');
        
        if (incomeTransactions.length === 0) {
            incomeContainer.innerHTML = '<p class="text-muted text-center">No hay ingresos registrados</p>';
            return;
        }
        
        incomeContainer.innerHTML = '';
        incomeTransactions.forEach(transaction => {
            const transactionElement = this.createTransactionElement(transaction, false);
            incomeContainer.appendChild(transactionElement);
        });
    }
    
    // Renderizar transacciones de egresos
    renderExpenseTransactions() {
        const expenseContainer = document.getElementById('expense-transactions');
        const expenseTransactions = this.transactions.filter(t => t.type === 'expense');
        const totalIncome = this.calculateTotalIncome();
        
        if (expenseTransactions.length === 0) {
            expenseContainer.innerHTML = '<p class="text-muted text-center">No hay egresos registrados</p>';
            return;
        }
        
        expenseContainer.innerHTML = '';
        expenseTransactions.forEach(transaction => {
            // FÓRMULA CORRECTA: Porcentaje individual de cada egreso
            const percentage = totalIncome > 0 ? (transaction.amount * 100) / totalIncome : 0;
            const transactionElement = this.createTransactionElement(transaction, true, percentage);
            expenseContainer.appendChild(transactionElement);
        });
    }
    
    // Crear elemento HTML para una transacción
    createTransactionElement(transaction, showPercentage, percentage = 0) {
        const transactionDiv = document.createElement('div');
        transactionDiv.className = 'transaction-item';
        
        const transactionContent = document.createElement('div');
        transactionContent.className = 'transaction-content';
        
        // Icono para la transacción
        const icon = document.createElement('div');
        icon.className = `transaction-icon ${transaction.type === 'income' ? 'income-icon' : 'expense-icon'}`;
        icon.textContent = transaction.type === 'income' ? '↑' : '↓';
        transactionContent.appendChild(icon);
        
        const descriptionDiv = document.createElement('div');
        descriptionDiv.textContent = transaction.description;
        descriptionDiv.style.fontWeight = '500';
        transactionContent.appendChild(descriptionDiv);
        
        const amountDiv = document.createElement('div');
        amountDiv.className = 'd-flex align-items-center';
        
        const amountSpan = document.createElement('span');
        amountSpan.className = transaction.type === 'income' ? 'text-success' : 'text-danger';
        // PUNTO 3b: Usar toFixed(2) para redondeo
        amountSpan.textContent = `${transaction.type === 'income' ? '+' : '-'} $${transaction.amount.toFixed(2)}`;
        
        amountDiv.appendChild(amountSpan);
        
        if (showPercentage) {
            const percentageBadge = document.createElement('span');
            percentageBadge.className = 'percentage-badge';
            // PUNTO 3b: Usar toFixed(1) para el porcentaje
            percentageBadge.textContent = `${percentage.toFixed(1)}%`;
            amountDiv.appendChild(percentageBadge);
        }
        
        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn-delete';
        deleteButton.innerHTML = '×';
        deleteButton.title = 'Eliminar transacción';
        deleteButton.addEventListener('click', () => {
            this.deleteTransaction(transaction.id);
        });
        
        amountDiv.appendChild(deleteButton);
        
        transactionDiv.appendChild(transactionContent);
        transactionDiv.appendChild(amountDiv);
        
        return transactionDiv;
    }
    
    // PUNTO 2 y 3: Calcular totales
    calculateTotals() {
        const totalIncome = this.calculateTotalIncome();
        const totalExpense = this.calculateTotalExpense();
        // PUNTO 2: Total disponible = Ingresos - Egresos
        const totalAmount = totalIncome - totalExpense;
        
        // Agregar animación a los cambios
        this.animateValue('total-amount', totalAmount);
        this.animateValue('income-amount', totalIncome, '+ ');
        this.animateValue('expense-amount', totalExpense, '- ');
        
        // Porcentaje de gastos
        const expensePercentage = totalIncome > 0 ? (totalExpense * 100 / totalIncome) : 0;
        document.getElementById('expense-percentage').textContent = `${expensePercentage.toFixed(0)}%`;
    }
    
    // Animación para cambios de valores
    animateValue(elementId, newValue, prefix = '') {
        const element = document.getElementById(elementId);
        const currentValue = parseFloat(element.textContent.replace(/[^\d.-]/g, '')) || 0;
        
        element.classList.add('amount-change');
        setTimeout(() => {
            element.classList.remove('amount-change');
        }, 600);
        
        // Actualizar color basado en el valor
        if (elementId === 'total-amount') {
            element.className = `card-title ${newValue >= 0 ? 'text-success' : 'text-danger'}`;
        }
        
        element.textContent = `${prefix}$${Math.abs(newValue).toFixed(2)}`;
    }
    
    // Calcular total de ingresos
    calculateTotalIncome() {
        return this.transactions
            .filter(t => t.type === 'income')
            .reduce((total, t) => total + t.amount, 0);
    }
    
    // Calcular total de egresos
    calculateTotalExpense() {
        return this.transactions
            .filter(t => t.type === 'expense')
            .reduce((total, t) => total + t.amount, 0);
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new BudgetApp();
});