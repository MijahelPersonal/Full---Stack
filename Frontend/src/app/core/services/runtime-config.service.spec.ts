import {afterEach,expect,it,vi} from 'vitest';
import {RuntimeConfigService} from './runtime-config.service';

afterEach(()=>{vi.unstubAllGlobals();delete window.gestionDesktop;});
it('web obtiene el API de configuración sin cachear',async()=>{
 const fetchMock=vi.fn().mockResolvedValue({ok:true,json:async()=>({apiUrl:'https://api.example.com/api'})});vi.stubGlobal('fetch',fetchMock);
 const config=new RuntimeConfigService();await config.initialize();expect(config.apiUrl).toBe('https://api.example.com/api');expect(fetchMock).toHaveBeenCalledWith('/config.json',{cache:'no-store'});
});
it('web rechaza URLs con credenciales',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({apiUrl:'https://usuario:clave@api.example.com/api'})}));
 await expect(new RuntimeConfigService().initialize()).rejects.toThrow('URL de API inválida');
});
it('Electron conserva la configuración proporcionada por preload',async()=>{
 window.gestionDesktop={getConfig:async()=>({apiUrl:'https://api.example.com/api/'})};
 const config=new RuntimeConfigService();await config.initialize();expect(config.apiUrl).toBe('https://api.example.com/api');
});
