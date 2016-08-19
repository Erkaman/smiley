module.exports=require('ndpack-image')(64,64,4,"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")