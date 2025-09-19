# Обновление статуса устройства на final_qc

## Логика работы

Когда завершается repair job, система автоматически проверяет, есть ли еще незавершенные repair jobs для этого устройства:

### 1. Проверка незавершенных repair jobs
```sql
SELECT id, status 
FROM repair_jobs 
WHERE device_id = ? 
AND status IN ('pending', 'in_progress') 
AND deleted_at IS NULL
```

### 2. Если все repair jobs завершены
- ✅ Устройство переводится в статус `final_qc`
- ✅ Создается запись QC check для финального контроля
- ✅ Записывается история изменения статуса

### 3. Если есть незавершенные repair jobs
- ⏳ Устройство остается в текущем статусе
- ⏳ Ожидается завершение остальных repair jobs

## Логирование

### Серверные логи (в консоли сервера)
- `🎯 All repairs completed for device {id}, sending to final QC`
- `📊 Device repair jobs summary: [...]` - список всех repair jobs устройства
- `🔄 Updating device {id} status to final_qc`
- `✅ Successfully updated device {id} status to final_qc`
- `⏳ Device {id} still has pending repairs, not sending to QC yet`
- `🏁 Repair job completion finished. Device sent to QC: true/false`

### Клиентские логи (в консоли браузера)
- `🔧 [CLIENT] Starting repair job completion`
- `📡 [CLIENT] API response status: 200`
- `✅ [CLIENT] API success response: { device_sent_to_qc: true }`

## Проверка работы

### В консоли браузера ищите:
1. `✅ [CLIENT] API success response: { device_sent_to_qc: true }`
2. Если `device_sent_to_qc: true` - устройство отправлено в final QC
3. Если `device_sent_to_qc: false` - есть еще незавершенные repair jobs

### В логах сервера ищите:
1. `🎯 All repairs completed for device {id}, sending to final QC`
2. `✅ Successfully updated device {id} status to final_qc`
3. `🏁 Repair job completion finished. Device sent to QC: true`

## Возможные проблемы

1. **Устройство не переходит в final_qc** - проверьте логи на наличие ошибок
2. **Есть незавершенные repair jobs** - завершите все repair jobs для устройства
3. **Ошибка обновления статуса** - проверьте права доступа к базе данных
4. **Проблемы с кэшем** - проверьте инвалидацию кэша в клиентских логах
