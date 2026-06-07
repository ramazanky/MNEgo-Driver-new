// services/soundService.js
import { Audio } from 'expo-av';

class SoundService {
  constructor() {
    this.sounds = {};
    this.isLoaded = false;
  }

  async loadSounds() {
    try {
      const soundFiles = {
        switchOn: require('../../assets/sounds/switch_on.mp3'),
        switchOff: require('../../assets/sounds/switch_off.mp3'),
        newRide: require('../../assets/sounds/new_ride.mp3'),
        reject: require('../../assets/sounds/reject.mp3')
      };

      for (const [key, file] of Object.entries(soundFiles)) {
        try {
          const { sound } = await Audio.Sound.createAsync(file);
          this.sounds[key] = sound;
        } catch (e) {
          console.log(`${key} ses dosyası yok`);
        }
      }
      this.isLoaded = true;
    } catch (error) {
      console.log('Ses yükleme hatası:', error);
    }
  }

  async playSound(key) {
    try {
      if (this.sounds[key]) {
        await this.sounds[key].replayAsync();
      }
    } catch (e) { }
  }

  async playSwitchOn() { await this.playSound('switchOn'); }
  async playSwitchOff() { await this.playSound('switchOff'); }
  async playNewRide() { await this.playSound('newRide'); }
  async playRideRejected() { await this.playSound('reject'); }

  async unloadSounds() {
    for (const sound of Object.values(this.sounds)) {
      try { await sound?.unloadAsync(); } catch (e) { }
    }
  }
}

const soundService = new SoundService();
export default soundService;