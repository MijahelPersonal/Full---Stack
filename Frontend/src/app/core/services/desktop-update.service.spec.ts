import {afterEach,expect,it,vi} from 'vitest';
import {DesktopUpdateService} from './desktop-update.service';
afterEach(()=>delete window.gestionDesktop);
it('web funciona sin bridge Electron',async()=>{const service=new DesktopUpdateService();await service.action('check');expect(service.state()).toBeNull();expect(service.visible()).toBe(false);});
it('silencia consulta inicial y errores, avisa disponibilidad y permite más tarde',async()=>{
 let receive:(state:DesktopUpdateState)=>void=()=>{};
 const check=vi.fn().mockResolvedValue({status:'current',version:'0.1.0'});
 window.gestionDesktop={getConfig:async()=>({apiUrl:'https://example.com/api'}),updates:{getState:async()=>({status:'idle',version:'0.1.0'}),check,download:check,install:check,onState:cb=>{receive=cb;return ()=>{};}}};
 const service=new DesktopUpdateService();await Promise.resolve();
 receive({status:'error',version:'0.1.0'});expect(service.visible()).toBe(false);
 receive({status:'available',version:'0.1.0',nextVersion:'0.2.0'});expect(service.visible()).toBe(true);expect(check).not.toHaveBeenCalled();
 service.visible.set(false);receive({status:'downloading',version:'0.1.0',percent:50});expect(service.visible()).toBe(false);
 receive({status:'ready',version:'0.1.0',nextVersion:'0.2.0'});expect(service.visible()).toBe(true);
});
