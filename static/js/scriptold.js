$(document).ready(function() {
    function getUserRole() {
        // Check if we're in an admin route
        const path = window.location.pathname;
        if (path.includes('/admin/')) {
            return 'admin';
        }
        // Check if we're in a client route
        if (path.includes('/client/')) {
            return 'client';
        }
        // Default to admin if unsure
        return 'admin';
    }
    // Função para exibir popups
    function showPopup(message, isError) {
        const popup = $('<div>').addClass('popup').text(message);
        if (isError) {
            popup.addClass('error');
        } else {
            popup.addClass('success');
        }
        $('body').append(popup);
        setTimeout(() => {
            popup.css('opacity', '0');
            setTimeout(() => popup.remove(), 500);
        }, 2000);
    }

    // Função para extrair o nome da tabela da URL
    function getTableNameFromURL() {
        const path = window.location.pathname; // Obtém o caminho da URL (ex: "/admin/view_table/users")
        const parts = path.split('/'); // Divide o caminho em partes
        return parts[parts.length - 1]; // Retorna a última parte (ex: "users")
    }

    // Coletar dados da tabela para validação de duplicatas
    let existingIds = [];
    let existingNames = [];
    let existingEmails = [];
    let existingPhones = [];

    $('.users-table tbody tr').each(function() {
        existingIds.push($(this).find('td:eq(0)').text().trim()); // ID
        existingNames.push($(this).find('td:eq(1)').text().trim()); // Nome
        existingEmails.push($(this).find('td:eq(2)').text().trim()); // Email
        existingPhones.push($(this).find('td:eq(3)').text().trim()); // Telefone
    });

    // Função para validar o formato do telefone brasileiro
    function isValidBrazilianPhone(phone) {
        const regex = /^(?:\+55)?\s?(?:\(?\d{2}\)?)?\s?9?\d{4}-?\d{4}$/;
        return regex.test(phone);
    }

    // Busca dinâmica
    $('#searchForm').on('submit', function(event) {
        event.preventDefault();
        const searchQuery = $('#search_query').val();
        const tableName = getTableNameFromURL();
        const userRole = getUserRole();

        if (!searchQuery) {
            showPopup('Por favor, preencha o campo de busca.', true);
            return;
        }

        $.ajax({
            url: `/${userRole}/search`,
            type: 'POST',
            data: { table_name: tableName, search_query: searchQuery },
            // ... rest of the code ...
        });
    });

    // Update add data function
    $('#addDataForm').on('submit', function(event) {
        event.preventDefault();
        const tableName = getTableNameFromURL();
        const formData = $(this).serializeArray();
        const newData = {};
        const userRole = getUserRole();

        // ... rest of the validation code ...

        $.ajax({
            url: `/${userRole}/add_data`,
            type: 'POST',
            data: { ...newData, table_name: tableName },
            // ... rest of the code ...
        });
    });

    // Update update data function
    $(document).on('click', '.save-btn', function() {
        const row = $(this).closest('tr');
        const id = row.data('id');
        const tableName = getTableNameFromURL();
        const updatedData = {};
        const userRole = getUserRole();

        // ... rest of the code ...

        $.ajax({
            url: `/${userRole}/update_data`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ id: id, table_name: tableName, ...updatedData }),
            // ... rest of the code ...
        });
    });

    // Adicionar dados dinamicamente
    $('#addDataForm').on('submit', function(event) {
        event.preventDefault();
        const tableName = getTableNameFromURL(); // Obtém o nome da tabela da URL
        const formData = $(this).serializeArray();
        const newData = {};

        // Converte o formData em um objeto
        formData.forEach(field => {
            newData[field.name] = field.value;
        });

        // Validações
        if (existingIds.includes(newData.user_id)) {
            showPopup('Erro: O ID já está em uso. Insira um ID único.', true);
            return;
        }
        if (existingNames.includes(newData.name)) {
            showPopup('Erro: O nome já está em uso. Insira um nome único.', true);
            return;
        }
        if (existingEmails.includes(newData.email)) {
            showPopup('Erro: O email já está em uso. Insira um email único.', true);
            return;
        }
        if (existingPhones.includes(newData.phone)) {
            showPopup('Erro: O número de telefone já está em uso. Insira um número único.', true);
            return;
        }
        if (!isValidBrazilianPhone(newData.phone)) {
            showPopup('Número de telefone inválido! Insira um número válido do Brasil.', true);
            return;
        }

        // Envia os dados para o backend
        $.ajax({
            url: '/admin/add_data',
            type: 'POST',
            data: { ...newData, table_name: tableName },
            success: function(response) {
                if (response.status === 'success') {
                    showPopup('Registro adicionado com sucesso!', false);
                    setTimeout(() => location.reload(), 2000); // Recarrega a página após 2 segundos
                } else {
                    showPopup('Erro: ' + response.message, true);
                }
            },
            error: function(error) {
                console.error('Erro ao adicionar registro:', error);
                showPopup('Erro ao adicionar registro. Tente novamente.', true);
            }
        });
    });

    // Função para transformar uma linha em modo de edição
    function enableEditMode(row) {
        const cells = row.find('td:not(:last-child)'); // Ignora a última coluna (ações)
        cells.each(function() {
            const cell = $(this);
            const text = cell.text();
            cell.html(`<input type="text" value="${text}">`);
        });

        // Substitui o botão "Editar" por "Salvar" e "Cancelar"
        const actionCell = row.find('td:last-child');
        actionCell.html(`
            <button class="save-btn">Salvar</button>
            <button class="cancel-btn">Cancelar</button>
        `);
    }

    // Função para desabilitar o modo de edição e restaurar os valores originais
    function disableEditMode(row) {
        const cells = row.find('td:not(:last-child)');
        cells.each(function() {
            const cell = $(this);
            const input = cell.find('input');
            cell.text(input.val());
        });

        // Restaura o botão "Editar"
        const actionCell = row.find('td:last-child');
        actionCell.html(`<button class="edit-btn">Editar</button>`);
    }

    // Evento de clique no botão "Editar"
    $(document).on('click', '.edit-btn', function() {
        const row = $(this).closest('tr');
        enableEditMode(row);
    });

    // Evento de clique no botão "Cancelar"
    $(document).on('click', '.cancel-btn', function() {
        const row = $(this).closest('tr');
        disableEditMode(row);
    });

    // Evento de clique no botão "Salvar"
    $(document).on('click', '.save-btn', function() {
        const row = $(this).closest('tr');
        const id = row.data('id');
        const tableName = getTableNameFromURL();
        const updatedData = {};
    
        // Get column names from the table header
        const table = row.closest('table');
        const headers = table.find('thead th');
        
        // Collect the edited data
        row.find('td:not(:last-child)').each(function(index) {
            const columnName = headers.eq(index).text();
            const value = $(this).find('input').val();
            updatedData[columnName] = value;
        });
    
        // Send the updated data to the backend
        $.ajax({
            url: '/admin/update_data',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ id: id, table_name: tableName, ...updatedData }),
            success: function(response) {
                if (response.status === 'success') {
                    showPopup('Dados atualizados com sucesso!', false);
                    disableEditMode(row);
                } else {
                    showPopup('Erro ao atualizar dados: ' + response.message, true);
                }
            },
            error: function(error) {
                console.error('Erro ao atualizar dados:', error);
                showPopup('Erro ao atualizar dados. Tente novamente.', true);
            }
        });
    });
});