package com.mijahel.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.core.io.*;
import org.springframework.transaction.support.*;
import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.file.*;
import java.util.*;

@Service
public class ProductoImagenService {
 private final Path root;
 public ProductoImagenService(@Value("${app.productos.upload-dir:uploads/productos}") String directory){
   root=Path.of(directory).toAbsolutePath().normalize();
 }
 private ResponseStatusException invalida(){return new ResponseStatusException(HttpStatus.BAD_REQUEST,"Imagen inválida. Usa JPG, JPEG, PNG o WEBP de hasta 2 MB");}
 public String guardar(MultipartFile file){
   if(file.isEmpty()||file.getSize()>2*1024*1024)throw invalida();
   String nombre=Optional.ofNullable(file.getOriginalFilename()).orElse("").toLowerCase(Locale.ROOT);
   String extension=nombre.contains(".")?nombre.substring(nombre.lastIndexOf('.')+1):"";
   if(!Set.of("jpg","jpeg","png","webp").contains(extension))throw invalida();
   try{
     byte[] data=file.getBytes();
     boolean jpeg=data.length>3&&(data[0]&255)==255&&(data[1]&255)==216&&(data[2]&255)==255;
     boolean png=data.length>8&&Arrays.equals(Arrays.copyOf(data,8),new byte[]{(byte)137,80,78,71,13,10,26,10});
     boolean webp=data.length>=20&&new String(data,0,4,java.nio.charset.StandardCharsets.US_ASCII).equals("RIFF")
       &&new String(data,8,4,java.nio.charset.StandardCharsets.US_ASCII).equals("WEBP")
       &&Set.of("VP8 ","VP8L","VP8X").contains(new String(data,12,4,java.nio.charset.StandardCharsets.US_ASCII))
       &&((long)(data[4]&255)|((long)(data[5]&255)<<8)|((long)(data[6]&255)<<16)|((long)(data[7]&255)<<24))==data.length-8;
     String detected=jpeg?"jpg":png?"png":webp?"webp":"";
     if(detected.isEmpty()||!(extension.equals(detected)||extension.equals("jpeg")&&detected.equals("jpg")))throw invalida();
     if(!Objects.equals(file.getContentType(),"image/"+(detected.equals("jpg")?"jpeg":detected)))throw invalida();
     if(webp){validarWebp(data);}else{
       try(var stream=ImageIO.createImageInputStream(new ByteArrayInputStream(data))){
         var readers=ImageIO.getImageReaders(stream);if(!readers.hasNext())throw invalida();
         var reader=readers.next();
         try{
           reader.setInput(stream);
           int w=reader.getWidth(0),h=reader.getHeight(0);
           if(w<=0||h<=0||(long)w*h>16000000)throw invalida();
           BufferedImage image=reader.read(0);if(image==null)throw invalida();
         }finally{reader.dispose();}
       }
     }
     Files.createDirectories(root);
     Path target=root.resolve(UUID.randomUUID()+"."+detected);
     Files.write(target,data,StandardOpenOption.CREATE_NEW);
     if(TransactionSynchronizationManager.isSynchronizationActive()){
       TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization(){
         @Override public void afterCompletion(int status){if(status!=STATUS_COMMITTED) borrar(target);}
       });
     }
     return "/api/productos/imagenes/"+target.getFileName();
   }catch(IOException e){throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"No se pudo leer o guardar la imagen");}
 }
 private long entero(byte[] data,int start,int bytes){long n=0;for(int i=0;i<bytes;i++)n|=(long)(data[start+i]&255)<<(i*8);return n;}
 private void dimensiones(long w,long h){if(w<=0||h<=0||w*h>16000000)throw invalida();}
 private void validarWebp(byte[] data){
   boolean frame=false;int offset=12;
   while(offset<data.length){
     if(offset+8>data.length)throw invalida();
     String tipo=new String(data,offset,4,java.nio.charset.StandardCharsets.US_ASCII);long size=entero(data,offset+4,4);int start=offset+8;
     if(size>data.length-start)throw invalida();
     if(tipo.equals("VP8 ")){
       if(size<10 || (data[start]&1)!=0 || (data[start+3]&255)!=157 || data[start+4]!=1 || data[start+5]!=42)throw invalida();
       dimensiones(entero(data,start+6,2)&16383,entero(data,start+8,2)&16383);frame=true;
     }else if(tipo.equals("VP8L")){
       if(size<5 || data[start]!=47)throw invalida();long bits=entero(data,start+1,4);
       if((bits>>>29)!=0)throw invalida();dimensiones((bits&16383)+1,((bits>>>14)&16383)+1);frame=true;
     }else if(tipo.equals("VP8X")){
       if(size!=10)throw invalida();dimensiones(entero(data,start+4,3)+1,entero(data,start+7,3)+1);
     }
     long siguiente=(long)start+size+(size&1);if(siguiente>data.length)throw invalida();offset=(int)siguiente;
   }
   if(!frame)throw invalida();
 }
 public void eliminarAnteriorAlConfirmar(String url){
   if(url==null)return;
   Path target=ruta(url.substring(url.lastIndexOf('/')+1));
   TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization(){
     @Override public void afterCommit(){borrar(target);}
   });
 }
 private void borrar(Path target){try{Files.deleteIfExists(target);}catch(IOException e){System.getLogger(getClass().getName()).log(System.Logger.Level.WARNING,"No se pudo limpiar una imagen antigua");}}
 private Path ruta(String nombre){
   if(!nombre.matches("[0-9a-f-]{36}\\.(jpg|png|webp)"))throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Imagen no encontrada");
   Path target=root.resolve(nombre).normalize();
   if(!target.getParent().equals(root))throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Imagen no encontrada");
   return target;
 }
 public Resource leer(String nombre){
   Path target=ruta(nombre);
   if(!Files.isRegularFile(target,LinkOption.NOFOLLOW_LINKS))throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Imagen no encontrada");
   return new FileSystemResource(target);
 }
}
