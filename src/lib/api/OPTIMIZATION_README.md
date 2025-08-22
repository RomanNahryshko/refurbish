# API Optimization: Singleton Supabase Client Pattern

## Проблема

До оптимизации каждый API route создавал **новый Supabase клиент** для каждого HTTP запроса:

```typescript
// ❌ ПЛОХО: Создается новый клиент для каждого запроса
const supabase = await createSupabaseServerClient()
```

Это происходило в **каждом** API endpoint, что приводило к:
- Избыточному созданию соединений
- Нагрузке на Supabase
- Неэффективному использованию ресурсов

## Решение

### 1. Singleton Supabase Client

```typescript
// src/lib/supabase/server.ts
let supabaseClientInstance: SupabaseClient | null = null

export async function createSupabaseServerClient() {
  // Возвращаем существующий экземпляр если уже создан
  if (supabaseClientInstance) {
    return supabaseClientInstance
  }
  
  // Создаем новый только один раз
  supabaseClientInstance = createServerClient(/* ... */)
  return supabaseClientInstance
}
```

### 2. Centralized API Factory

```typescript
// src/lib/api/api-factory.ts
class APIFactory {
  private supabase: SupabaseClient | null = null

  private async getSupabaseClient(): Promise<SupabaseClient> {
    if (!this.supabase) {
      this.supabase = await createSupabaseServerClient()
    }
    return this.supabase
  }

  async getInventoryAPI() {
    const client = await this.getSupabaseClient()
    return createInventoryAPI(client)
  }
}

export const apiFactory = new APIFactory()
```

### 3. Dependency Injection в API Routes

```typescript
// ❌ ДО: Создание нового клиента
const supabase = await createSupabaseServerClient()
const inventoryApi = createInventoryAPI(supabase)

// ✅ ПОСЛЕ: Использование factory
const inventoryApi = await apiFactory.getInventoryAPI()
```

## Преимущества

1. **Один клиент на весь сервер** - Supabase клиент создается только один раз
2. **Переиспользование соединений** - все API calls используют один экземпляр
3. **Лучшая производительность** - меньше нагрузки на Supabase
4. **Централизованное управление** - все API через один factory
5. **Легче тестировать** - можно мокать factory вместо отдельных клиентов

## Миграция

### Шаг 1: Обновить API Route

```typescript
// Было
import { createSupabaseServerClient } from '@/lib/supabase/server'
const supabase = await createSupabaseServerClient()

// Стало
import { apiFactory } from '@/lib/api/api-factory'
const inventoryApi = await apiFactory.getInventoryAPI()
```

### Шаг 2: Добавить API в Factory

```typescript
// src/lib/api/api-factory.ts
async getBatchesAPI() {
  const client = await this.getSupabaseClient()
  return createBatchesAPI(client)
}
```

### Шаг 3: Обновить все Routes

Заменить все вызовы `createSupabaseServerClient()` на использование `apiFactory`.

## Текущий статус

✅ **Завершено:**
- `inventory/parts` route
- `inventory/stock-adjustments` route
- Singleton Supabase client
- API factory pattern

🔄 **В процессе:**
- Остальные API routes (batches, repair-jobs, suppliers, etc.)

## Мониторинг

После миграции всех routes:
- Меньше соединений к Supabase
- Лучшая производительность API
- Снижение нагрузки на базу данных

## Best Practices

1. **Всегда используйте `apiFactory`** вместо прямого создания клиентов
2. **Добавляйте новые API в factory** при создании
3. **Не создавайте клиенты в компонентах** - только через API routes
4. **Используйте dependency injection** в API классах
