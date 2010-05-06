package pro.ba;

import android.content.Context;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.GridView;
import android.widget.TextView;

public class NumberAdapter extends BaseAdapter {
	private Context mContext;
	private int mSize;
	
	public NumberAdapter(Context c) {
		mContext = c;
		//mSize = size;
		//mNumbs = new Integer[mSize];
		//for (int i=0; i<mSize; i++) {
		//	mNumbs[i] = i;
		//}
	}
	
	@Override
	public int getCount() {
		return mNumbs.length;
	}

	@Override
	public Object getItem(int position) {
		return null;
	}

	@Override
	public long getItemId(int position) {
		return 0;
	}

	@Override
	public View getView(int position, View convertView, ViewGroup parent) {
		TextView tv;
		if (convertView == null) { // then we're not recycling convertView so give it some attributes
			tv = new TextView(mContext);
			tv.setLayoutParams(new GridView.LayoutParams(85,85));
			//nView.setPadding(8, 8, 8, 8);
		} else {
			tv = (TextView) convertView;
		}
		tv.setText(mNumbs[position]);
		return tv;
	}

	private String[] mNumbs = {"0","1","2","3","4","5","6","7","8","9","10","11"};
}
