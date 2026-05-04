import React from 'react'

export async function CheckPeriod(period: string) {

    let period_value = "1 Day";

    if(period === "1day"){
    
        period_value = "1 Day";

    }else if(period === "this7days"){

        period_value = "7 Day";

    }else if(period === "thismonth"){

        period_value = "1 Month";

    }else if(period === "3months"){

        period_value = "3 Months";

    }else if(period === "6months"){

        period_value = "6 Months";

    }else if(period === "thisyear"){

        period_value = "1 Year";

    }else if(period === "bydate"){

        period_value = "By Date";

    }

  return period_value
}

export async function Aggregation(aggregation_value: string){

    if(aggregation_value === "perday"){
        aggregation_value = "Per Day";
    }else if(aggregation_value === "usage"){
        aggregation_value = "Usage";
    }else{
        aggregation_value = "Per Day";
    }


    return aggregation_value
}

export async function Unit(unit_value: string){



    if(unit_value === "Liter"){
        unit_value = "Liter";
    }else if(unit_value === "kg"){
        unit_value = "kg";
    }else if(unit_value === "m3"){
        unit_value = "m³";
    }else{
        unit_value = "kg";
    }


    return unit_value
}


