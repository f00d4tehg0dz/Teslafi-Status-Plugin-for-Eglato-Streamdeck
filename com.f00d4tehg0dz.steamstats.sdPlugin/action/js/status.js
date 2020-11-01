/**
 * @param {canvas} cnv an existing canvas element in the DOM
 */

function Block(cnv)
{
	if (!cnv) return;
	var ctx = cnv.getContext('2d');


	function getImageData() 
	{
		return cnv.toDataURL();
	}

	return {
		getImageData: getImageData,
		
	}
}
