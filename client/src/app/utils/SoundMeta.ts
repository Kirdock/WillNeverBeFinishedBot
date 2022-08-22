import { FileInfo, ISoundMeta } from '../interfaces/sound-meta';

export function setFileInfo(soundMeta: ISoundMeta, src: string, fullName: string): soundMeta is (ISoundMeta & { fileInfo: FileInfo }) {
  soundMeta.fileInfo = {src, fullName};
  return true;
}
