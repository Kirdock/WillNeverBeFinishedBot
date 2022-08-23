import { IHomeSettings } from '../interfaces/home-settings';

export function createHomeSettings(): IHomeSettings {
  return {
    volume: 0.5,
    joinUser: true,
    recordVoiceMinutes: 1,
  };
}
