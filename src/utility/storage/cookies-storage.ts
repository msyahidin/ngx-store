import { Config, debug } from '../../config/config';
export interface WebStorage extends Storage {
   setItem(key: string, data: string, expirationDate?: Date): void;
}

// TODO: in future use ES6 Proxy to handle indexers
export class CookiesStorage implements Storage {
    [key: string]: any;
    [index: number]: string;

    public get length(): number {
        return this.getAllKeys().length;
    }

    public key(index: number): string | any {
        return this.getAllKeys()[index];
    }

    public getItem(key: string): string | any {
        return this.getAllItems().get(key);
    }

    public removeItem(key: string): void {
        if (typeof document === 'undefined') return;
        document.cookie = key + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
    }

    /**
     * @param key
     * @param data
     * @param expirationDate passing null affects in lifetime cookie
     */
    public setItem(key: string, data: string, expirationDate?: Date): void {
        if (typeof document === 'undefined') return;
        let domain = this.resolveDomain(Config.cookiesScope);
        debug.log('Cookies domain:', domain);
        domain = (domain) ? 'domain=' + domain + ';' : '';
        let utcDate = '';
        if (expirationDate instanceof Date) {
            utcDate = expirationDate.toUTCString();
        } else if (expirationDate === null) {
            utcDate = 'Fri, 18 Dec 2099 12:00:00 GMT';
        }
        let expires = utcDate ? '; expires=' + utcDate + ';' : '';
        let cookie = key + '=' + data + expires + 'path=/;' + domain;
        debug.log('Cookie`s set instruction:', cookie);
        document.cookie = cookie;
    }

    public clear(): void {
        this.getAllKeys().forEach(key => this.removeItem(key));
    }

    public forEach(func: (value: string, key: string) => any): void {
        return this.getAllItems().forEach((value, key) => func(value, key));
    }

    protected getAllKeys(): Array<string> {
        return Array.from(this.getAllItems().keys());
    }

    // TODO: consider getting cookies from all paths
    protected getAllItems(): Map<string, string> {
        let map = new Map();
        if (typeof document === 'undefined') return map;
        let cookies = document.cookie.split(';');

        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim();
            let eqPos = cookie.indexOf("=");
            let key = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
            let value = eqPos > -1 ? cookie.substr(eqPos + 1, cookie.length): cookie;
            map.set(key, value);
        }
        return map;
    }

    protected resolveDomain(path: string): string {
        let hostname = window.location.hostname;
        if ((hostname.match(/\./g) || []).length < 1) {
            return '';
        }
        let www = (hostname.indexOf('www.') === 0) ? 'www.' : '';
        while (path.indexOf('../') > -1) {
            path = path.substr(3, '../'.length);
            hostname = hostname.split('.').slice(1).join('.');
        }
        return www + path + hostname;
    }
}

export const cookiesStorage = new CookiesStorage();
