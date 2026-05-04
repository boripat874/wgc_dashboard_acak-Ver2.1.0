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
