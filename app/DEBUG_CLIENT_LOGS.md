# Отладка клиентских логов для Complete Repair

## Проблема
На клиенте нет логов после complete repair и устройство не переходит в final_qc.

## Добавленное подробное логирование

### 1. Начало процесса (страница)
```
🔧 [PAGE] handleCompleteRepair called with repair: { id, device_id, repair_type, status }
🔄 [PAGE] partsRecording state updated: { repairId, parts, notes }
```

### 2. Вызов функции завершения (страница)
```
🚀 [PAGE] submitCompleteRepair called with: { parts, notes, partsRecording, timestamp }
🚀 [PAGE] Starting repair completion process: { repairId, hasNotes, partsCount }
🔄 [PAGE] Loading state set to true
📤 [PAGE] Calling completeRepairJob.mutate with data: { repairJobId, completionNotes, partsUsed }
```

### 3. Мутация (хук)
```
🚀 [CLIENT] useCompleteRepairJob mutationFn called
🔧 [CLIENT] Starting repair job completion: { repairJobId, hasCompletionNotes, partsCount, timestamp }
📤 [CLIENT] Sending request to API: { url, method, body }
```

### 4. API запрос (хук)
```
📡 [CLIENT] API response received: { status, statusText, ok, headers }
✅ [CLIENT] API success response: { device_sent_to_qc, message, data, timestamp }
```

### 5. Успешное завершение (хук)
```
🎉 [CLIENT] onSuccess called with data: { data, repairJobId, partsUsedCount, timestamp }
🔄 [CLIENT] Starting query invalidation process
📋 [CLIENT] Invalidating repair jobs queries...
✅ [CLIENT] Repair jobs queries invalidated
📱 [CLIENT] Invalidating devices queries...
✅ [CLIENT] Devices queries invalidated
🔍 [CLIENT] Invalidating QC checks queries...
✅ [CLIENT] QC checks queries invalidated
🏁 [CLIENT] All queries invalidated successfully
```

### 6. Успешное завершение (страница)
```
✅ [PAGE] onSuccess callback called with data: { data }
🔄 [PAGE] Loading state set to false, partsRecording cleared
```

### 7. Ошибки
```
❌ [CLIENT] Error in API call: { error, message, stack }
❌ [CLIENT] onError called: { error, message, stack, repairJobId, timestamp }
❌ [PAGE] onError callback called with error: { error }
```

## Как использовать для отладки

### 1. Откройте консоль браузера (F12 → Console)

### 2. Завершите repair job и следите за логами

### 3. Проверьте последовательность логов:

**Если процесс работает правильно, вы должны увидеть:**
1. `🔧 [PAGE] handleCompleteRepair called` - нажатие кнопки Complete
2. `🚀 [PAGE] submitCompleteRepair called` - вызов функции завершения
3. `🚀 [CLIENT] useCompleteRepairJob mutationFn called` - вызов мутации
4. `📤 [CLIENT] Sending request to API` - отправка запроса
5. `📡 [CLIENT] API response received` - получение ответа
6. `✅ [CLIENT] API success response` - успешный ответ
7. `🎉 [CLIENT] onSuccess called` - успешное завершение
8. `✅ [PAGE] onSuccess callback called` - завершение на странице

### 4. Возможные проблемы:

**Если нет логов вообще:**
- Проверьте, нажимается ли кнопка Complete
- Проверьте, есть ли ошибки JavaScript

**Если логи останавливаются на каком-то этапе:**
- Найдите последний лог и посмотрите, что происходит дальше
- Проверьте, есть ли ошибки после последнего лога

**Если есть ошибки:**
- Скопируйте полный текст ошибки
- Проверьте stack trace для понимания, где произошла ошибка

### 5. Фильтрация логов в консоли:

- Введите `[PAGE]` для просмотра только логов страницы
- Введите `[CLIENT]` для просмотра только логов хука
- Введите `repair` для просмотра всех логов связанных с repair jobs
- Введите `error` для просмотра только ошибок

### 6. Проверка состояния мутации:

Также добавлены логи состояния мутации:
```
🔄 [PAGE] completeRepairJob state changed: { isSuccess, isError, isPending, error, data }
```

Эти логи покажут, как меняется состояние мутации в реальном времени.
