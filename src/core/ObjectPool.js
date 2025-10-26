// src/core/ObjectPool.js
export class ObjectPool {
    constructor(createFunc, resetFunc) {
        this.createFunc = createFunc; // 如何創建新物件
        this.resetFunc = resetFunc;   // 如何重置物件
        this.pool = [];
    }

    get() {
        let obj; // 宣告 obj

        if (this.pool.length > 0) {
            // 從池中取出
            obj = this.pool.pop();
        } else {
            // 池是空的，創建一個新的
            obj = this.createFunc();
        }

        // ▼▼▼ 修正點 ▼▼▼
        // 無論是從池中 'pop' 還是新 'create'，
        // 都必須在返回前呼叫 resetFunc！
        this.resetFunc(obj); 
        
        return obj;
    }

    release(obj) {
        // 將物件歸還池中
        this.pool.push(obj);
    }
}