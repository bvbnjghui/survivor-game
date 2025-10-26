// src/core/EntityManager.js
export class EntityManager {
    constructor() {
        this.entities = new Set(); // 所有實體 ID
        this.components = new Map(); // componentType -> Map<entityId, componentData>
        this.nextEntityId = 0;
    }

    createEntity() {
        const id = this.nextEntityId++;
        this.entities.add(id);
        return id;
    }

    destroyEntity(entityId) {
        this.entities.delete(entityId);
        for (const componentMap of this.components.values()) {
            componentMap.delete(entityId);
        }
    }

    addComponent(entityId, componentType, componentData) {
        if (!this.components.has(componentType)) {
            this.components.set(componentType, new Map());
        }
        this.components.get(componentType).set(entityId, componentData);
    }

    removeComponent(entityId, componentType) {
        const componentMap = this.components.get(componentType);
        if (componentMap) {
            componentMap.delete(entityId);
        }
    }

    getComponent(entityId, componentType) {
        const componentMap = this.components.get(componentType);
        return componentMap ? componentMap.get(entityId) : null;
    }

    hasComponent(entityId, componentType) {
        const componentMap = this.components.get(componentType);
        return componentMap ? componentMap.has(entityId) : false;
    }

    getEntitiesWithComponents(...componentTypes) {
        const result = [];
        for (const entityId of this.entities) {
            if (componentTypes.every(type => this.hasComponent(entityId, type))) {
                result.push(entityId);
            }
        }
        return result;
    }

    destroyAllEntities() {
        this.entities.clear();
        for (const componentMap of this.components.values()) {
            componentMap.clear();
        }
        this.nextEntityId = 0;
    }
}