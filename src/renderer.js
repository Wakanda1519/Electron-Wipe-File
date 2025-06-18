document.addEventListener('DOMContentLoaded', async () => {
  // Инициализация Bootstrap модальных окон
  const operationModal = new bootstrap.Modal(document.getElementById('operationModal'));
  const logsModal = new bootstrap.Modal(document.getElementById('logsModal'));
  const helpModal = new bootstrap.Modal(document.getElementById('helpModal'));
  
  // DOM-элементы
  const operationsContainer = document.getElementById('operationsContainer');
  const emptyState = document.getElementById('emptyState');
  const operationForm = document.getElementById('operationForm');
  const operationId = document.getElementById('operationId');
  const operationName = document.getElementById('operationName');
  const typeFile = document.getElementById('typeFile');
  const typeDirectory = document.getElementById('typeDirectory');
  const pathDisplay = document.getElementById('pathDisplay');
  const pathValue = document.getElementById('pathValue');
  const extensionsGroup = document.getElementById('extensionsGroup');
  const extensions = document.getElementById('extensions');
  const operationModalTitle = document.getElementById('operationModalTitle');
  const saveOperationBtn = document.getElementById('saveOperationBtn');
  const deleteOperationBtn = document.getElementById('deleteOperationBtn');
  const selectPathBtn = document.getElementById('selectPathBtn');
  const addOperationBtn = document.getElementById('addOperationBtn');
  const helpBtn = document.getElementById('helpBtn');
  const selectedItemsList = document.getElementById('selectedItemsList');
  const addItemBtn = document.getElementById('addItemBtn');
  
  // Логи
  const logsModalTitle = document.getElementById('logsModalTitle');
  const logsSpinner = document.getElementById('logsSpinner');
  const logsContent = document.getElementById('logsContent');
  const successLogs = document.getElementById('successLogs');
  const errorLogs = document.getElementById('errorLogs');
  const logsSummary = document.getElementById('logsSummary');
  
  // Загрузка операций
  let operations = await window.api.getOperations();
  renderOperations();
  
  // Временное хранилище для выбранных элементов
  let selectedItems = [];
  
  // Обработчики событий
  addOperationBtn.addEventListener('click', () => {
    resetOperationForm();
    operationModalTitle.textContent = 'Добавить операцию';
    saveOperationBtn.textContent = 'Создать операцию';
    deleteOperationBtn.style.display = 'none';
    selectedItems = [];
    renderSelectedItems();
    operationModal.show();
  });
  
  // Обработчик для кнопки справки
  helpBtn.addEventListener('click', () => {
    helpModal.show();
  });
  
  typeFile.addEventListener('change', toggleExtensionsField);
  typeDirectory.addEventListener('change', toggleExtensionsField);
  
  addItemBtn.addEventListener('click', async () => {
    if (!pathValue.value) {
      alert('Пожалуйста, выберите файл или папку');
      return;
    }
    
    if (typeDirectory.checked && !extensions.value.trim()) {
      alert('Пожалуйста, укажите расширения файлов');
      return;
    }
    
    const newItem = {
      id: Date.now().toString(),
      type: typeFile.checked ? 'file' : 'directory',
      path: pathValue.value,
      extensions: typeDirectory.checked ? extensions.value : ''
    };
    
    selectedItems.push(newItem);
    
    // Сброс полей формы для добавления следующего элемента
    pathDisplay.value = '';
    pathValue.value = '';
    extensions.value = '';
    
    renderSelectedItems();
  });
  
  selectPathBtn.addEventListener('click', async () => {
    let path;
    if (typeFile.checked) {
      path = await window.api.selectFile();
    } else {
      path = await window.api.selectDirectory();
    }
    
    if (path) {
      pathDisplay.value = path;
      pathValue.value = path;
    }
  });
  
  saveOperationBtn.addEventListener('click', async () => {
    if (!operationForm.checkValidity()) {
      operationForm.reportValidity();
      return;
    }
    
    if (selectedItems.length === 0) {
      alert('Пожалуйста, добавьте хотя бы один файл или папку');
      return;
    }
    
    const operation = {
      id: operationId.value || Date.now().toString(),
      name: operationName.value,
      items: selectedItems
    };
    
    if (operationId.value) {
      // Редактирование
      const index = operations.findIndex(op => op.id === operationId.value);
      if (index !== -1) {
        operations[index] = operation;
      }
    } else {
      // Добавление
      operations.push(operation);
    }
    
    await window.api.saveOperations(operations);
    renderOperations();
    operationModal.hide();
  });
  
  deleteOperationBtn.addEventListener('click', async () => {
    if (confirm('Вы уверены, что хотите удалить эту операцию?')) {
      operations = operations.filter(op => op.id !== operationId.value);
      await window.api.saveOperations(operations);
      renderOperations();
      operationModal.hide();
    }
  });
  
  // Функции
  function toggleExtensionsField() {
    if (typeDirectory.checked) {
      extensionsGroup.style.display = 'block';
    } else {
      extensionsGroup.style.display = 'none';
    }
  }
  
  function resetOperationForm() {
    operationId.value = '';
    operationName.value = '';
    typeFile.checked = true;
    typeDirectory.checked = false;
    pathDisplay.value = '';
    pathValue.value = '';
    extensions.value = '';
    extensionsGroup.style.display = 'none';
    selectedItems = [];
    renderSelectedItems();
  }
  
  function renderSelectedItems() {
    selectedItemsList.innerHTML = '';
    
    if (selectedItems.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'text-muted text-center py-3';
      emptyMessage.textContent = 'Нет выбранных элементов';
      selectedItemsList.appendChild(emptyMessage);
      return;
    }
    
    selectedItems.forEach((item, index) => {
      const itemElement = document.createElement('div');
      itemElement.className = 'list-group-item d-flex justify-content-between align-items-center';
      
      const itemInfo = document.createElement('div');
      itemInfo.innerHTML = `
        <div><strong>${item.type === 'file' ? 'Файл' : 'Папка'}</strong></div>
        <div style="word-break: break-all;">${item.path}</div>
        ${item.type === 'directory' ? `<small>Расширения: ${item.extensions}</small>` : ''}
      `;
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-sm btn-outline-danger';
      deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
      deleteBtn.addEventListener('click', () => {
        selectedItems.splice(index, 1);
        renderSelectedItems();
      });
      
      itemElement.appendChild(itemInfo);
      itemElement.appendChild(deleteBtn);
      selectedItemsList.appendChild(itemElement);
    });
  }
  
  function renderOperations() {
    // Очистка контейнера
    const operationCards = operationsContainer.querySelectorAll('.operation-card');
    operationCards.forEach(card => card.remove());
    
    // Показать/скрыть пустое состояние
    if (operations.length === 0) {
      emptyState.style.display = 'block';
    } else {
      emptyState.style.display = 'none';
      
      // Отрисовка операций
      operations.forEach(operation => {
        const card = document.createElement('div');
        card.className = 'card operation-card';
        card.dataset.id = operation.id;
        
        // Подсчет количества файлов и папок
        const fileCount = operation.items.filter(item => item.type === 'file').length;
        const dirCount = operation.items.filter(item => item.type === 'directory').length;
        
        card.innerHTML = `
          <div class="card-body">
            <button class="edit-btn" data-id="${operation.id}">
              <i class="bi bi-gear"></i>
            </button>
            <h5 class="card-title">${operation.name}</h5>
            <h6 class="card-subtitle mb-2 text-muted">
              Файлов: ${fileCount}, Папок: ${dirCount}
            </h6>
            <p class="card-text">
              <small>Всего элементов: ${operation.items.length}</small>
            </p>
          </div>
        `;
        
        operationsContainer.appendChild(card);
        
        // Обработчик клика по карточке
        card.addEventListener('click', (e) => {
          // Если клик не по кнопке редактирования
          if (!e.target.closest('.edit-btn')) {
            executeOperation(operation);
          }
        });
        
        // Обработчик клика по кнопке редактирования
        const editBtn = card.querySelector('.edit-btn');
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          editOperation(operation);
        });
      });
    }
  }
  
  function editOperation(operation) {
    operationId.value = operation.id;
    operationName.value = operation.name;
    
    // Загрузка выбранных элементов
    selectedItems = [...operation.items];
    renderSelectedItems();
    
    operationModalTitle.textContent = 'Редактировать операцию';
    saveOperationBtn.textContent = 'Сохранить изменения';
    deleteOperationBtn.style.display = 'block';
    
    operationModal.show();
  }
  
  // Функция для выполнения операции с подтверждением
  async function executeOperation(operation) {
    // Показываем диалог подтверждения
    if (!confirm(`Вы уверены, что хотите запустить операцию "${operation.name}"?\nЭто приведет к удалению файлов, которое невозможно отменить.`)) {
      return; // Если пользователь отменил, прерываем выполнение
    }
    
    logsModalTitle.textContent = `Логи операции: ${operation.name}`;
    logsSpinner.style.display = 'block';
    logsContent.style.display = 'none';
    successLogs.innerHTML = '';
    errorLogs.innerHTML = '';
    
    logsModal.show();
    
    let allResults = {
      success: [],
      errors: []
    };
    
    // Выполнение операций для каждого элемента
    for (const item of operation.items) {
      let results;
      
      if (item.type === 'file') {
        const result = await window.api.deleteFile(item.path);
        results = {
          success: result.success ? [item.path] : [],
          errors: result.success ? [] : [{ path: item.path, error: result.error }]
        };
      } else {
        results = await window.api.deleteFilesInDirectory({
          directoryPath: item.path,
          extensions: item.extensions
        });
      }
      
      // Объединение результатов
      allResults.success = [...allResults.success, ...results.success];
      allResults.errors = [...allResults.errors, ...results.errors];
    }
    
    // Сохранение логов
    await window.api.saveLogs({
      operationId: operation.id,
      logs: allResults
    });
    
    // Добавляем задержку в 1 секунду перед показом логов
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Отображение логов
    displayLogs(allResults);
  }
  
  function displayLogs(logs) {
    // Скрыть спиннер, показать контент
    logsSpinner.style.display = 'none';
    logsContent.style.display = 'block';
    
    // Очистка предыдущих логов
    successLogs.innerHTML = '';
    errorLogs.innerHTML = '';
    
    // Добавление успешных операций
    if (logs.success.length > 0) {
      logs.success.forEach(path => {
        const li = document.createElement('li');
        li.textContent = path;
        // Добавляем title для возможности просмотра полного пути при наведении
        li.title = path;
        successLogs.appendChild(li);
      });
    } else {
      const li = document.createElement('li');
      li.textContent = 'Нет успешно удаленных файлов';
      successLogs.appendChild(li);
    }
    
    // Добавление ошибок
    if (logs.errors.length > 0) {
      logs.errors.forEach(error => {
        const li = document.createElement('li');
        
        // Форматируем сообщение об ошибке для лучшей читаемости
        let errorMessage = error.error;
        
        // Преобразуем технические сообщения об ошибках в более понятные
        if (errorMessage.includes('no such file or directory')) {
          errorMessage = 'Файл не найден';
        } else if (errorMessage.includes('permission denied')) {
          errorMessage = 'Отказано в доступе';
        } else if (errorMessage.includes('is being used by another process')) {
          errorMessage = 'Файл используется другим процессом';
        } else if (errorMessage.includes('directory not empty')) {
          errorMessage = 'Папка не пуста';
        }
        
        // Получаем имя файла из пути
        const fileName = error.path.split(/[/\\]/).pop();
        
        li.textContent = `${fileName}: ${errorMessage}`;
        li.title = `${error.path}: ${error.error}`;
        errorLogs.appendChild(li);
      });
    } else {
      const li = document.createElement('li');
      li.textContent = 'Нет ошибок';
      errorLogs.appendChild(li);
    }
    
    // Обновление сводки
    logsSummary.textContent = `Успешно: ${logs.success.length}, Ошибок: ${logs.errors.length}`;
  }
}); 