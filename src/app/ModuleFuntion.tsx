export const checkMode = (mode:number,status:number) => {

  // console.log("checkMode :: ",mode,status)


    if (mode == 0) {

      return 'Auto Stop'

    }else if (mode == 1) {

      if (Number(status) == 1) {
        return 'Auto Start'
      }else{
        return 'Auto Stop'
      }

    }else{
      return 'Auto Stop'
    }
  }

export const checkStatusMotor = (SP_total:number,Rcipe:number,StatusRunMotor:number) => {
    if (StatusRunMotor == 1) {
      return 'Running'
    }else if(Rcipe > SP_total){
      return 'Ready'
    }else{
      return 'Not Ready'
    }
}

import { format, startOfDay, addHours } from 'date-fns';

export const generate24HourTimeline = (date: Date) => {
  const timeline = [];
  const startOfTheDay = startOfDay(date); // Get the start of the day (e.g., 00:00)

  for (let i = 0; i < 24; i++) {
    const hour = addHours(startOfTheDay, i); // Add i hours to the start of the day
    timeline.push({
      name: format(hour, 'yyyy-MM-dd HH:mm'),
      value: 0,
    });
  }
  return timeline;
};
