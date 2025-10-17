/**
 * State Manager - Redux-like pattern
 * Phase 3: Modular Architecture
 */
export class StateManager {
    constructor() {
        this.state = {};
        this.listeners = [];
    }
    
    getState() {
        return { ...this.state };
    }
    
    setState(updates) {
        this.state = { ...this.state, ...updates };
        this.notify();
    }
    
    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }
    
    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }
    
    reset() {
        this.state = {};
        this.notify();
    }
}
