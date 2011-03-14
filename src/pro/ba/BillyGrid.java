package pro.ba;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Bundle;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.view.View.OnClickListener;
import android.view.View.OnKeyListener;
import android.view.View.OnLongClickListener;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TableLayout;
import android.widget.TableRow;
import android.widget.TextView;
import android.widget.Toast;

public class BillyGrid extends Activity {
	private static String BPREFS = "BLB_prefs";
	private static String BCOUNT = "BLB_count";
	private static String BSUBSET = "BLB_subset";
	private static String BPR_EVAL = "BLB_eval";
	private static String BPR_ENTRY = "BLB_entry";

	private static int billySize = 20;
	private static int nCols;
	private static int billyUnLit = Color.DKGRAY;

	private SharedPreferences billyPrefs;
	private TableLayout billyGrid;
	private EditText billyProb;
	private TextView billyCount;
	private TextView billyEval;
	private LinearLayout billyBack;
	
	private boolean[] billySubset;
	private int[] billyColors = {
			R.drawable.colors_grad_02, 
			R.drawable.colors_grad_06, 
			R.drawable.colors_grad_10,
			R.drawable.colors_grad_04,
			R.drawable.colors_grad_08
			};
	
	/** Called when the activity is first created. */
	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		
		nCols = (int) Math.ceil(Math.sqrt(billySize));
		
		setContentView(R.layout.grid);		
		billyBack = (LinearLayout) findViewById(R.id.billysuper);
		billyPrefs = getSharedPreferences(BPREFS, 0);
		billyCount = (TextView) findViewById(R.id.billycount);
		billyEval = (TextView) findViewById(R.id.billyeval);
		billyProb = (EditText) findViewById(R.id.billyprob);
		billyGrid = (TableLayout) findViewById(R.id.billygrid);
		
		//billyProb.setInputType(InputType.TYPE_CLASS_NUMBER);
		((Button) findViewById(R.id.billybutton))
			.setOnClickListener(new OnClickListener() {
				@Override
				public void onClick(View v) {
					billyMe(v);
				}
		});
		billyProb.setOnKeyListener(
		  new OnKeyListener() {
			@Override
			public boolean onKey(View v, int keyCode, KeyEvent ke) {
				// enter = 66
				if (keyCode == 66) {
					if ( ke.getAction() == KeyEvent.ACTION_UP ) { 
					  billyMe(v);
					}
					return true;
				}
				return false;
			}
		});
		billyProb.setOnLongClickListener(
			new OnLongClickListener() {
					
				@Override
				public boolean onLongClick(View v) {
					((EditText) v).selectAll();
					return true;
				}
		});
		/*
		billyProb.setOnClickListener(
			new OnClickListener() {
				@Override
				public void onClick(View v) {
					InputMethodManager imm = (InputMethodManager)getSystemService(Context.INPUT_METHOD_SERVICE);
					
					imm.hideSoftInputFromWindow(myEditText.getWindowToken(), 0);
				}
			}
		);
		*/
		createBillyGrid();
	}
	
	private void billyMe(View v) {
		int err = -1;
		try {
			String pre = BillyTilities.preprocess(billyProb.getText()
					.toString());
			double p = BillyTilities.arithmeval(pre);
			billySubset = BillyTilities.BillySubset(billySize, Math.max(0, 
					Math.min(1, p)));
			updateBillyGrid(billySubset, false);
			p = Math.round(100.0*p)/100.0;
			String addendum = "";
			if (p > 1) {
				addendum = " (p > 1)";
				err = R.string.out_of_bounds_err;
			} else if (p < 0) {
				addendum = " (p < 0)";
				err = R.string.out_of_bounds_err;
			}
			billyEval.setText(p+addendum);
			setCount(getCount()+1);
			
			billyBack.setBackgroundResource(
					billyColors[getCount() % billyColors.length]);
		} catch (Exception e) {
			billyEval.setText("NaN");
			updateBillyGrid(billySubset, true);
			err = R.string.parse_err;
		}
		if (err >= 0) 
			Toast.makeText(v.getContext(), err, Toast.LENGTH_SHORT).show();
	}

	/* Creates the menu items */
	public boolean onCreateOptionsMenu(Menu menu) {
	    menu.add(0, 42, 0, "Help");
	    return true;
	}

	/* Handles item selections */
	public boolean onOptionsItemSelected(MenuItem item) {
	    switch (item.getItemId()) {
	    case 42:
	        showHelp();
	        return true;
	    }
	    return false;
	}
	
	private void showHelp() {
		AlertDialog.Builder builder = new AlertDialog.Builder(this);
		builder.setMessage(R.string.explanatory)
			.setCancelable(true)
		    .setPositiveButton("OK", new DialogInterface.OnClickListener() {
		    	public void onClick(DialogInterface dialog, int id) {
		    		dialog.cancel();
		    	}
		    });
		AlertDialog alert = builder.create();
		alert.show();
	}
	
	@Override
	protected void onStart() {
		super.onStart();
		setCount(billyPrefs.getInt(BCOUNT, 0));
		billySubset = BillyTilities.int2bitvec(billyPrefs.getInt(BSUBSET, 0),billySize);
		updateBillyGrid(billySubset, true);
		billyProb.setText(billyPrefs.getString(BPR_ENTRY, ""));
		billyEval.setText(billyPrefs.getString(BPR_EVAL, ""));
		
		billyBack.setBackgroundResource(
				billyColors[getCount() % billyColors.length]);
	}
	
	@Override
	protected void onStop() {
		super.onStop();
		SharedPreferences.Editor ed = billyPrefs.edit();
		ed.putInt(BCOUNT, getCount());
		ed.putInt(BSUBSET, BillyTilities.bitvec2int(billySubset));
		ed.putString(BPR_EVAL, billyEval.getText().toString());
		ed.putString(BPR_ENTRY, billyProb.getText().toString());
		ed.commit();
	}
	
	private void setCount(Integer n) {
		billyCount.setText(n.toString());
	}
	private Integer getCount() {
		return new Integer(billyCount.getText().toString());
	}
	
	// call this to refresh layout (tablelayout) with new probability
	// cache = true if loading from memory vs new roll
	void updateBillyGrid(boolean[] bsub, boolean isCache) {
		for (int i=0; i<billyGrid.getChildCount(); i++) {
			TableRow tr = (TableRow) billyGrid.getChildAt(i);
			for (int j=0; j<tr.getChildCount(); j++) {
				TextView tv = (TextView) tr.getChildAt(j);
				if ( bsub[i*nCols + j] ) {
					tv.setTextColor(Color.WHITE);
					tv.setTypeface(Typeface.DEFAULT_BOLD);
				} else {
					tv.setTextColor(billyUnLit);
					tv.setTypeface(Typeface.DEFAULT);
				}
				tv.requestLayout();
			}
		}
		billyGrid.requestLayout();
	}

	// make the billyGrid. start with all views false.
	private void createBillyGrid() {
		TableRow row = null;
		for (int i=0; i<billySize; i++) {
			if (i % nCols == 0) {
				billyGrid.addView(new TableRow(this));
				row = (TableRow) billyGrid.getChildAt(billyGrid.getChildCount()-1);
			}
			row.addView(billyGetView(i+1));
		}
		billyGrid.setStretchAllColumns(true);
	}

	TextView billyGetView(int n) {
		TextView tv = new TextView(this);
		tv.setText(""+n);
		tv.setGravity(Gravity.CENTER);
		tv.setTextSize(24);
		tv.setPadding(0,4,0,4);
		tv.setTextColor(billyUnLit);

		return tv;
	}

}