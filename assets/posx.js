module.exports=require('ndpack-image')(64,64,4,"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")