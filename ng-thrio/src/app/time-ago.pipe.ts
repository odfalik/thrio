import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeAgo',
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: any, args?: any): any {
    if (value) {
      const seconds = Math.floor((+new Date() - +new Date(value)) / 1000);
      if (seconds < 29) return 'Just now';
      const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        min: 60,
        sec: 1,
      };
      let counter: number;
      for (const i in intervals) {
        if (i) {
          counter = Math.floor(seconds / intervals[i]);
          if (counter > 0)
            return counter === 1
              ? counter + ' ' + i + ' ago'
              : counter + ' ' + i + 's ago';
        }
      }
    }
    return value;
  }
}
