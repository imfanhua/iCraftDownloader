String.prototype.getMid = function(start, end) {
	let self = this.valueOf();
	let index = self.indexOf(start);
	if (index === -1) return null;
	index += start.length;
	let endIndex = self.indexOf(end, index);
	return endIndex === -1 ? null : self.substring(index, endIndex);
};

module.exports = {};