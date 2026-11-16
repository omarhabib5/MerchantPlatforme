import mongose from "mongoose";

const customerSchema = new mongose.shema(
    {
        name :{ type: string, required: true},
        number : {type: number,required: true},
        adress : {type: string, required: true},
        orderID : {type: mongose.Schema.Types.ObjectId, ref: 'Order', required: true},


    });