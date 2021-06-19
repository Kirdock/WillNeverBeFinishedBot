import { HttpHeaders, HttpResponse } from "@angular/common/http";

export class SoundMeta {
    public time!: number;
    public _id!: string;
    public fileName!: string;
    public category!: string;
    public userId!: string;
    public username?: string;
    public serverId!: string;
    public fileInfo?: {src: string, fullName: string};

    public setFileInfo(response: HttpResponse<Blob>) {
        this.fileInfo = {
            src: URL.createObjectURL(response.body),
            fullName: this.getFileNameOutOfHeader(response.headers)
        };
    }

    private getFileNameOutOfHeader(headers: HttpHeaders){
        let fileName = '';
        const disposition = headers.get('content-disposition');
        if (disposition?.includes('attachment')) {
            const reg = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            const matches = reg.exec(disposition);
            if (matches?.[1]) { 
              fileName = matches[1].replace(/['"]/g, '');
            }
        }
        return fileName;
      }

      public static fromJSON(data: any): SoundMeta {
          return Object.assign(new this(), data);
      }
}